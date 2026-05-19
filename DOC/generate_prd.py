from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ── helpers ─────────────────────────────────────────────────────────────────

def set_cell_bg(cell, hex_color):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)

def set_cell_borders(cell, color='CCCCCC'):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ('top','left','bottom','right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'),   'single')
        el.set(qn('w:sz'),    '4')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), color)
        tcBorders.append(el)
    tcPr.append(tcBorders)

def remove_cell_borders(cell):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ('top','left','bottom','right','insideH','insideV'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'), 'nil')
        tcBorders.append(el)
    tcPr.append(tcBorders)

def add_paragraph_border_bottom(para, color='E2E8F0'):
    pPr  = para._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot  = OxmlElement('w:bottom')
    bot.set(qn('w:val'),   'single')
    bot.set(qn('w:sz'),    '4')
    bot.set(qn('w:space'), '1')
    bot.set(qn('w:color'), color)
    pBdr.append(bot)
    pPr.append(pBdr)

# ── palette ──────────────────────────────────────────────────────────────────

PRIMARY   = RGBColor(0x1E, 0x3A, 0x5F)   # deep navy
ACCENT    = RGBColor(0x27, 0xAE, 0x60)   # green
LIGHT_BG  = 'EBF5FB'
HEADER_BG = '1E3A5F'
ALT_ROW   = 'F4F6F8'
WHITE     = 'FFFFFF'
BORDER_C  = 'BDC3C7'

# ── document setup ───────────────────────────────────────────────────────────

doc = Document()

# Page margins (A4)
for section in doc.sections:
    section.top_margin    = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)

# Default font
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10.5)

# ── style helpers ─────────────────────────────────────────────────────────────

def h1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after  = Pt(6)
    add_paragraph_border_bottom(p, '1E3A5F')
    run = p.add_run(text)
    run.font.name  = 'Calibri'
    run.font.size  = Pt(16)
    run.font.bold  = True
    run.font.color.rgb = PRIMARY
    return p

def h2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run(text)
    run.font.name  = 'Calibri'
    run.font.size  = Pt(12)
    run.font.bold  = True
    run.font.color.rgb = PRIMARY
    return p

def body(text, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(10.5)
    return p

def bullet(text, level=0):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent   = Pt(18 + level * 18)
    p.paragraph_format.space_after   = Pt(3)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(10.5)
    return p

def info_box(text, bg='EBF5FB', border='2980B9'):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent  = Cm(0.5)
    p.paragraph_format.right_indent = Cm(0.5)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(6)
    pPr  = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    for side in ('top','left','bottom','right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'),   'single')
        el.set(qn('w:sz'),    '6' if side == 'left' else '4')
        el.set(qn('w:space'), '4')
        el.set(qn('w:color'), border)
        pBdr.append(el)
    pPr.append(pBdr)
    run = p.add_run(text)
    run.font.name   = 'Calibri'
    run.font.size   = Pt(10)
    run.font.italic = True
    return p

# ── COVER PAGE ────────────────────────────────────────────────────────────────

# Spacer
for _ in range(4):
    doc.add_paragraph()

# Title
title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
t = title_p.add_run('PRODUCT REQUIREMENTS DOCUMENT')
t.font.name  = 'Calibri'
t.font.size  = Pt(26)
t.font.bold  = True
t.font.color.rgb = PRIMARY

doc.add_paragraph()

subtitle_p = doc.add_paragraph()
subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
s = subtitle_p.add_run('Maalify')
s.font.name  = 'Calibri'
s.font.size  = Pt(20)
s.font.bold  = True
s.font.color.rgb = ACCENT

tagline_p = doc.add_paragraph()
tagline_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
tg = tagline_p.add_run('Platform Pencatatan Keuangan Keluarga (SaaS)')
tg.font.name  = 'Calibri'
tg.font.size  = Pt(13)
tg.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

for _ in range(2):
    doc.add_paragraph()

# Meta table (borderless)
meta_table = doc.add_table(rows=5, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ('Versi',       'v1.0.0'),
    ('Tanggal',     '15 Mei 2026'),
    ('Status',      'Draft'),
    ('Penulis',     'Rizman'),
    ('Platform',    'Web Application (SaaS)'),
]
for i, (label, value) in enumerate(meta_data):
    row = meta_table.rows[i]
    lc = row.cells[0]; vc = row.cells[1]
    remove_cell_borders(lc); remove_cell_borders(vc)
    lc.width = Cm(4); vc.width = Cm(8)
    lp = lc.paragraphs[0]; lp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    lr = lp.add_run(label + ' :')
    lr.font.name = 'Calibri'; lr.font.size = Pt(10.5); lr.font.bold = True
    lr.font.color.rgb = PRIMARY
    vp = vc.paragraphs[0]
    vr = vp.add_run('  ' + value)
    vr.font.name = 'Calibri'; vr.font.size = Pt(10.5)

doc.add_page_break()

# ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────────────────────

h1('1. Executive Summary')
body(
    'Maalify adalah platform SaaS berbasis web yang dirancang untuk membantu '
    'keluarga mengelola keuangan rumah tangga secara terstruktur, transparan, dan mudah '
    'dipahami. Sistem ini memungkinkan setiap keluarga memiliki akun sendiri dengan '
    'kemampuan multi-pengguna di dalam satu household, mencatat pemasukan dan pengeluaran, '
    'mengelola anggaran, memantau utang/pinjaman, serta melihat laporan keuangan dalam '
    'bentuk grafik dan dashboard interaktif.'
)
info_box(
    'Visi: Menjadi solusi pencatatan keuangan keluarga #1 di Asia Tenggara — '
    'sederhana, aman, dan dapat diakses dari mana saja.'
)

doc.add_paragraph()

# Summary table
h2('Ringkasan Produk')
sum_tbl = doc.add_table(rows=6, cols=2)
sum_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
sum_data = [
    ('Nama Produk',     'Maalify'),
    ('Tipe',            'SaaS Web Application'),
    ('Target Pengguna', 'Keluarga (multi-household, multi-user)'),
    ('Platform',        'Web (Desktop & Mobile Browser)'),
    ('Bahasa',          'Bahasa Indonesia (utama), English (opsional)'),
    ('Monetisasi',      'Freemium + Subscription bulanan/tahunan'),
]
for i, (k, v) in enumerate(sum_data):
    row = sum_tbl.rows[i]
    kc = row.cells[0]; vc = row.cells[1]
    bg = ALT_ROW if i % 2 == 0 else WHITE
    set_cell_bg(kc, bg); set_cell_bg(vc, bg)
    set_cell_borders(kc, BORDER_C); set_cell_borders(vc, BORDER_C)
    kc.width = Cm(5); vc.width = Cm(10)
    kp = kc.paragraphs[0]
    kr = kp.add_run(k)
    kr.font.name = 'Calibri'; kr.font.size = Pt(10.5); kr.font.bold = True
    vp = vc.paragraphs[0]
    vr = vp.add_run(v)
    vr.font.name = 'Calibri'; vr.font.size = Pt(10.5)

doc.add_paragraph()

# ── 2. PROBLEM STATEMENT ──────────────────────────────────────────────────────

h1('2. Problem Statement')
body(
    'Banyak keluarga di Indonesia masih mengelola keuangan secara manual menggunakan '
    'buku catatan atau spreadsheet yang tidak terstruktur. Hal ini menyebabkan berbagai '
    'masalah nyata:'
)
problems = [
    'Tidak ada visibilitas real-time terhadap kondisi keuangan keluarga secara keseluruhan.',
    'Sulit memantau pengeluaran berlebih per kategori karena tidak ada sistem peringatan.',
    'Pengelolaan hutang dan cicilan dilakukan terpisah dan sering terlupakan.',
    'Anggota keluarga lain tidak bisa berkolaborasi mencatat secara bersamaan.',
    'Laporan dan analisis keuangan membutuhkan waktu lama jika dibuat manual.',
]
for p in problems:
    bullet(p)

doc.add_paragraph()

# ── 3. GOALS & SUCCESS METRICS ────────────────────────────────────────────────

h1('3. Goals & Success Metrics')
h2('3.1 Business Goals')
biz_goals = [
    'Mendapatkan 1.000 keluarga aktif dalam 6 bulan pertama sejak launch.',
    'Mencapai konversi free-to-paid sebesar 15% dalam tahun pertama.',
    'Mempertahankan Monthly Active User (MAU) rate di atas 70%.',
    'Net Promoter Score (NPS) ≥ 40 dalam 12 bulan pertama.',
]
for g in biz_goals:
    bullet(g)

h2('3.2 Product Goals')
prod_goals = [
    'Pengguna dapat mencatat transaksi dalam waktu < 30 detik.',
    'Dashboard menampilkan ringkasan keuangan yang dapat dipahami dalam < 1 menit.',
    'Sistem berjalan dengan uptime ≥ 99.5%.',
    'Semua halaman memuat dalam < 2 detik pada koneksi 4G.',
]
for g in prod_goals:
    bullet(g)

doc.add_paragraph()

# ── 4. TARGET USERS ───────────────────────────────────────────────────────────

h1('4. Target Users & Personas')
body(
    'Maalify dirancang untuk keluarga yang ingin mengelola keuangan bersama '
    'secara digital. Terdapat dua tipe utama pengguna dalam satu akun keluarga (household):'
)

# Persona table
h2('4.1 User Personas')
p_tbl = doc.add_table(rows=3, cols=3)
p_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT

# Header row
headers = ['', 'Kepala Keuangan (Admin)', 'Anggota Keluarga (Member)']
hrow = p_tbl.rows[0]
for i, h in enumerate(headers):
    c = hrow.cells[i]
    set_cell_bg(c, HEADER_BG)
    set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(h)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    p_el.alignment = WD_ALIGN_PARAGRAPH.CENTER

persona_rows = [
    ('Profil',
     'Dewasa 25–45 tahun, bertanggung jawab atas keuangan keluarga, '
     'melek teknologi, menggunakan smartphone/laptop.',
     'Pasangan atau anggota keluarga lain, ingin tahu kondisi keuangan, '
     'mencatat pengeluaran harian.'),
    ('Kebutuhan Utama',
     'Kontrol penuh atas budget, laporan komprehensif, manajemen akun & anggota.',
     'Kemudahan catat transaksi cepat, lihat ringkasan, akses dashboard.'),
]
for ri, (label, col1, col2) in enumerate(persona_rows):
    row = p_tbl.rows[ri + 1]
    bg = ALT_ROW if ri % 2 == 0 else WHITE
    cells_data = [(label, True, bg), (col1, False, bg), (col2, False, bg)]
    for ci, (txt, bold, bg_c) in enumerate(cells_data):
        c = row.cells[ci]
        set_cell_bg(c, bg_c)
        set_cell_borders(c, BORDER_C)
        p_el = c.paragraphs[0]
        r = p_el.add_run(txt)
        r.font.name = 'Calibri'; r.font.size = Pt(10); r.font.bold = bold

doc.add_paragraph()

# ── 5. FEATURES & REQUIREMENTS ────────────────────────────────────────────────

h1('5. Features & Requirements')
info_box(
    'Prioritas: P0 = Critical (MVP) | P1 = High (Launch) | P2 = Medium (Post-launch)'
)

# Feature table builder
def feature_table(features):
    """features = list of (id, name, description, priority, status)"""
    tbl = doc.add_table(rows=1 + len(features), cols=5)
    tbl.alignment = WD_TABLE_ALIGNMENT.LEFT

    col_widths = [Cm(1.5), Cm(3.5), Cm(7.5), Cm(1.8), Cm(2.2)]
    heads = ['ID', 'Fitur', 'Deskripsi', 'Prioritas', 'Status']

    hrow = tbl.rows[0]
    for i, (h, w) in enumerate(zip(heads, col_widths)):
        c = hrow.cells[i]; c.width = w
        set_cell_bg(c, HEADER_BG); set_cell_borders(c)
        p_el = c.paragraphs[0]
        r = p_el.add_run(h)
        r.font.name = 'Calibri'; r.font.size = Pt(10)
        r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p_el.alignment = WD_ALIGN_PARAGRAPH.CENTER

    prio_colors = {'P0': 'E74C3C', 'P1': 'E67E22', 'P2': '27AE60'}
    for fi, (fid, fname, fdesc, fprio, fstat) in enumerate(features):
        row = tbl.rows[fi + 1]
        bg = ALT_ROW if fi % 2 == 0 else WHITE
        vals = [fid, fname, fdesc, fprio, fstat]
        for ci, (val, w) in enumerate(zip(vals, col_widths)):
            c = row.cells[ci]; c.width = w
            set_cell_borders(c, BORDER_C)
            if ci == 3:
                prio_bg = prio_colors.get(val, bg)
                set_cell_bg(c, prio_bg)
            else:
                set_cell_bg(c, bg)
            p_el = c.paragraphs[0]
            if ci == 3:
                p_el.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p_el.add_run(val)
            r.font.name = 'Calibri'; r.font.size = Pt(9.5)
            if ci == 3:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

h2('5.1 Manajemen Akun & Household')
feature_table([
    ('F-01', 'Registrasi & Login',
     'Pengguna dapat mendaftar dengan email/password. Mendukung Google OAuth. '
     'Verifikasi email wajib sebelum akses penuh.',
     'P0', 'MVP'),
    ('F-02', 'Manajemen Household',
     'Setiap akun membuat/bergabung ke satu Household (unit keluarga). '
     'Admin dapat mengundang anggota via email atau kode undangan.',
     'P0', 'MVP'),
    ('F-03', 'Role & Permission',
     'Dua role: Admin (akses penuh) dan Member (catat transaksi, lihat laporan). '
     'Admin dapat mengubah role anggota.',
     'P0', 'MVP'),
    ('F-04', 'Profil Pengguna',
     'Pengguna dapat mengubah nama, foto profil, dan password.',
     'P1', 'Launch'),
])

doc.add_paragraph()
h2('5.2 Dompet (Wallet)')
feature_table([
    ('F-05', 'Multi Dompet',
     'Setiap Household dapat membuat beberapa dompet (contoh: Dompet Utama, '
     'Tabungan, Dompet Istri). Setiap dompet memiliki saldo awal dan mata uang.',
     'P0', 'MVP'),
    ('F-06', 'Transfer Antar Dompet',
     'Pengguna dapat memindahkan dana antar dompet dalam satu Household. '
     'Transfer tercatat sebagai transaksi khusus.',
     'P0', 'MVP'),
    ('F-07', 'Saldo Real-time',
     'Saldo setiap dompet diperbarui otomatis setiap kali ada transaksi baru.',
     'P0', 'MVP'),
])

doc.add_paragraph()
h2('5.3 Transaksi')
feature_table([
    ('F-08', 'Catat Pemasukan',
     'Pengguna dapat mencatat pemasukan dengan nominal, tanggal, kategori, '
     'dompet tujuan, dan catatan opsional.',
     'P0', 'MVP'),
    ('F-09', 'Catat Pengeluaran',
     'Pengguna dapat mencatat pengeluaran dengan nominal, tanggal, kategori, '
     'dompet sumber, dan catatan opsional.',
     'P0', 'MVP'),
    ('F-10', 'Kategori Kustom',
     'Admin dapat membuat, mengedit, dan menghapus kategori transaksi (income/expense) '
     'sesuai kebutuhan keluarga. Sistem menyediakan kategori default.',
     'P0', 'MVP'),
    ('F-11', 'Edit & Hapus Transaksi',
     'Pengguna dapat mengedit atau menghapus transaksi yang sudah dicatat. '
     'Member hanya dapat mengedit transaksi milik sendiri.',
     'P0', 'MVP'),
    ('F-12', 'Lampiran Bukti',
     'Pengguna dapat melampirkan foto struk/nota pada setiap transaksi (max 5MB per file).',
     'P1', 'Launch'),
    ('F-13', 'Transaksi Berulang',
     'Pengguna dapat mengatur transaksi otomatis berulang (harian/mingguan/bulanan) '
     'untuk pengeluaran rutin seperti listrik, internet, dll.',
     'P1', 'Launch'),
])

doc.add_paragraph()
h2('5.4 Anggaran (Budget)')
feature_table([
    ('F-14', 'Buat Budget per Kategori',
     'Admin dapat menetapkan batas anggaran untuk setiap kategori pengeluaran '
     'per periode (bulanan).',
     'P0', 'MVP'),
    ('F-15', 'Notifikasi Batas Budget',
     'Sistem mengirim notifikasi in-app saat pengeluaran mencapai 80% dan 100% '
     'dari budget yang ditetapkan.',
     'P0', 'MVP'),
    ('F-16', 'Overview Budget',
     'Halaman khusus menampilkan progress penggunaan budget per kategori '
     'dalam bentuk progress bar.',
     'P0', 'MVP'),
])

doc.add_paragraph()
h2('5.5 Hutang & Pinjaman')
feature_table([
    ('F-17', 'Catat Hutang (Saya Berhutang)',
     'Pengguna dapat mencatat hutang kepada pihak lain: nominal, pemberi hutang, '
     'tanggal jatuh tempo, dan cicilan.',
     'P0', 'MVP'),
    ('F-18', 'Catat Piutang (Orang Berhutang ke Saya)',
     'Pengguna dapat mencatat piutang dari pihak lain: nominal, debitur, '
     'tanggal jatuh tempo.',
     'P0', 'MVP'),
    ('F-19', 'Catat Pembayaran Cicilan',
     'Setiap pembayaran cicilan tercatat dan mengurangi sisa hutang/piutang secara otomatis.',
     'P0', 'MVP'),
    ('F-20', 'Reminder Jatuh Tempo',
     'Notifikasi otomatis H-7 dan H-1 sebelum tanggal jatuh tempo hutang.',
     'P1', 'Launch'),
])

doc.add_paragraph()
h2('5.6 Laporan & Dashboard')
feature_table([
    ('F-21', 'Dashboard Utama',
     'Menampilkan: total saldo semua dompet, pemasukan & pengeluaran bulan ini, '
     'grafik donat pengeluaran per kategori, transaksi terbaru.',
     'P0', 'MVP'),
    ('F-22', 'Grafik Tren Bulanan',
     'Grafik garis/batang menampilkan perbandingan pemasukan vs pengeluaran '
     'per bulan selama 6–12 bulan terakhir.',
     'P0', 'MVP'),
    ('F-23', 'Laporan Bulanan',
     'Ringkasan keuangan bulanan: total pemasukan, pengeluaran, tabungan, '
     'breakdown per kategori, dan perbandingan dengan bulan sebelumnya.',
     'P0', 'MVP'),
    ('F-24', 'Export Laporan',
     'Pengguna dapat mengekspor laporan dalam format PDF atau Excel '
     'untuk periode yang dipilih.',
     'P1', 'Launch'),
    ('F-25', 'Grafik Donat Kategori',
     'Visualisasi pengeluaran per kategori dalam bentuk pie/donut chart interaktif.',
     'P0', 'MVP'),
])

doc.add_paragraph()

# ── 6. NON-FUNCTIONAL REQUIREMENTS ────────────────────────────────────────────

h1('6. Non-Functional Requirements')

nfr = [
    ('Performa',     'Halaman utama load < 2s pada koneksi 4G. API response < 500ms untuk operasi CRUD.'),
    ('Keamanan',     'HTTPS wajib. Data keuangan dienkripsi at-rest & in-transit. Row Level Security (RLS) memastikan data household terisolasi.'),
    ('Skalabilitas', 'Arsitektur mampu mendukung 10.000+ household tanpa degradasi performa signifikan.'),
    ('Ketersediaan', 'Uptime target ≥ 99.5% (downtime maks ~3.6 jam/bulan). Maintenance window dijadwalkan di luar jam sibuk.'),
    ('Kompatibilitas','Support browser: Chrome, Firefox, Safari, Edge (2 versi terakhir). Responsive untuk layar 320px–1920px.'),
    ('Privasi',      'Kepatuhan terhadap regulasi perlindungan data. Tidak ada data pengguna yang dijual ke pihak ketiga.'),
    ('Backup',       'Backup database otomatis setiap 24 jam. Point-in-time recovery tersedia untuk 30 hari terakhir.'),
]
nfr_tbl = doc.add_table(rows=1 + len(nfr), cols=2)
nfr_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = nfr_tbl.rows[0]
for i, htxt in enumerate(['Aspek', 'Requirement']):
    c = hrow.cells[i]
    set_cell_bg(c, HEADER_BG); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

for ri, (aspect, req) in enumerate(nfr):
    row = nfr_tbl.rows[ri + 1]
    bg = ALT_ROW if ri % 2 == 0 else WHITE
    ac = row.cells[0]; rc = row.cells[1]
    ac.width = Cm(3.5); rc.width = Cm(13)
    set_cell_bg(ac, bg); set_cell_bg(rc, bg)
    set_cell_borders(ac, BORDER_C); set_cell_borders(rc, BORDER_C)
    ap = ac.paragraphs[0]
    ar = ap.add_run(aspect); ar.font.name = 'Calibri'; ar.font.size = Pt(10.5); ar.font.bold = True
    rp = rc.paragraphs[0]
    rr = rp.add_run(req); rr.font.name = 'Calibri'; rr.font.size = Pt(10.5)

doc.add_paragraph()

# ── 7. TECH STACK RECOMMENDATION ──────────────────────────────────────────────

h1('7. Rekomendasi Tech Stack')
info_box(
    'Rekomendasi ini dipilih berdasarkan kemudahan pengembangan, ekosistem yang matang, '
    'dan kesesuaian untuk SaaS multi-tenant dengan skala menengah.'
)

tech_categories = [
    ('Frontend',    'Next.js 14 (App Router)',
     'React framework modern dengan SSR/SSG built-in. Optimal untuk performa dan SEO.'),
    ('UI Library',  'Tailwind CSS + shadcn/ui',
     'Utility-first CSS yang cepat dikembangkan. shadcn/ui menyediakan komponen profesional siap pakai.'),
    ('Charts',      'Recharts',
     'Library grafik berbasis React yang ringan dan mudah dikustomisasi untuk dashboard.'),
    ('Backend',     'Next.js API Routes + Supabase Edge Functions',
     'Serverless API yang terintegrasi dengan frontend. Minimal overhead operasional.'),
    ('Database',    'Supabase (PostgreSQL)',
     'PostgreSQL managed dengan Row Level Security (RLS) bawaan — ideal untuk isolasi data multi-tenant.'),
    ('Auth',        'Supabase Auth',
     'Mendukung email/password dan OAuth (Google). Session management otomatis.'),
    ('Storage',     'Supabase Storage',
     'Penyimpanan file untuk lampiran bukti transaksi dengan akses terkontrol per household.'),
    ('Deployment',  'Vercel',
     'Platform deployment untuk Next.js dengan CDN global, preview deployments, dan auto-scaling.'),
    ('Monitoring',  'Vercel Analytics + Sentry',
     'Analytics performa dan error tracking real-time untuk menjaga kualitas produksi.'),
]

tech_tbl = doc.add_table(rows=1 + len(tech_categories), cols=3)
tech_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = tech_tbl.rows[0]
for i, htxt in enumerate(['Layer', 'Teknologi', 'Alasan']):
    c = hrow.cells[i]
    set_cell_bg(c, HEADER_BG); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
col_w = [Cm(2.8), Cm(4.5), Cm(9.3)]
for ri, (layer, tech, reason) in enumerate(tech_categories):
    row = tech_tbl.rows[ri + 1]
    bg = ALT_ROW if ri % 2 == 0 else WHITE
    for ci, (val, w) in enumerate(zip([layer, tech, reason], col_w)):
        c = row.cells[ci]; c.width = w
        set_cell_bg(c, bg); set_cell_borders(c, BORDER_C)
        p_el = c.paragraphs[0]
        r = p_el.add_run(val)
        r.font.name = 'Calibri'; r.font.size = Pt(10)
        if ci == 0: r.font.bold = True

doc.add_paragraph()

# ── 8. USER STORIES ────────────────────────────────────────────────────────────

h1('8. User Stories (MVP)')
stories = [
    ('US-01', 'Admin',  'mendaftarkan keluarga saya ke platform',
     'semua anggota keluarga bisa menggunakan satu akun bersama'),
    ('US-02', 'Admin',  'mengundang anggota keluarga',
     'mereka bisa ikut mencatat transaksi'),
    ('US-03', 'Member', 'mencatat pengeluaran harian dengan cepat',
     'saldo dompet saya selalu akurat'),
    ('US-04', 'Member', 'mencatat pemasukan bulanan',
     'total pemasukan keluarga terpantau'),
    ('US-05', 'Admin',  'membuat beberapa dompet (Dompet Utama, Tabungan)',
     'saldo tiap pos keuangan terpisah dan jelas'),
    ('US-06', 'Admin',  'menetapkan budget per kategori',
     'pengeluaran keluarga tidak melebihi batas'),
    ('US-07', 'Member', 'mendapat notifikasi saat budget hampir habis',
     'saya bisa mengontrol pengeluaran lebih baik'),
    ('US-08', 'Admin',  'mencatat hutang dan cicilan',
     'saya tidak lupa membayar kewajiban'),
    ('US-09', 'Member', 'melihat dashboard ringkasan keuangan',
     'saya tahu kondisi keuangan keluarga hari ini'),
    ('US-10', 'Admin',  'melihat laporan bulanan dengan grafik',
     'saya bisa evaluasi pola pengeluaran keluarga'),
]

us_tbl = doc.add_table(rows=1 + len(stories), cols=4)
us_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = us_tbl.rows[0]
for i, htxt in enumerate(['ID', 'Sebagai', 'Saya ingin...', 'Supaya...']):
    c = hrow.cells[i]
    set_cell_bg(c, HEADER_BG); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
us_col_w = [Cm(1.5), Cm(2.0), Cm(7.5), Cm(5.6)]
for ri, (sid, role, want, so) in enumerate(stories):
    row = us_tbl.rows[ri + 1]
    bg = ALT_ROW if ri % 2 == 0 else WHITE
    for ci, (val, w) in enumerate(zip([sid, role, want, so], us_col_w)):
        c = row.cells[ci]; c.width = w
        set_cell_bg(c, bg); set_cell_borders(c, BORDER_C)
        p_el = c.paragraphs[0]
        r = p_el.add_run(val)
        r.font.name = 'Calibri'; r.font.size = Pt(10)

doc.add_paragraph()

# ── 9. OUT OF SCOPE ────────────────────────────────────────────────────────────

h1('9. Out of Scope (v1.0)')
body('Fitur berikut tidak termasuk dalam scope versi pertama dan akan dievaluasi untuk roadmap selanjutnya:')
oos = [
    'Integrasi langsung dengan rekening bank atau dompet digital (e-wallet)',
    'Aplikasi mobile native (iOS/Android) — v1 hanya web responsive',
    'Fitur investasi dan portofolio saham/reksa dana',
    'Multi-currency dalam satu transaksi',
    'AI financial advisor / chatbot keuangan',
    'Laporan pajak otomatis',
    'Fitur splitting bill antar anggota keluarga',
]
for item in oos:
    bullet(item)

doc.add_paragraph()

# ── 10. TIMELINE ──────────────────────────────────────────────────────────────

h1('10. Proposed Timeline (MVP)')
tl_data = [
    ('Fase 1 — Fondasi',         'Minggu 1–3',
     'Setup project, arsitektur, auth, manajemen household & dompet, CRUD transaksi dasar'),
    ('Fase 2 — Core Features',   'Minggu 4–6',
     'Kategori kustom, budget & notifikasi, manajemen hutang/piutang'),
    ('Fase 3 — Dashboard',       'Minggu 7–9',
     'Dashboard interaktif, grafik laporan bulanan, tren keuangan'),
    ('Fase 4 — Polish & Launch', 'Minggu 10–12',
     'QA & testing, optimasi performa, onboarding flow, soft launch'),
]
tl_tbl = doc.add_table(rows=1 + len(tl_data), cols=3)
tl_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = tl_tbl.rows[0]
for i, htxt in enumerate(['Fase', 'Durasi', 'Deliverable']):
    c = hrow.cells[i]
    set_cell_bg(c, HEADER_BG); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
tl_col_w = [Cm(4.5), Cm(2.5), Cm(9.6)]
for ri, (fase, dur, deliv) in enumerate(tl_data):
    row = tl_tbl.rows[ri + 1]
    bg = ALT_ROW if ri % 2 == 0 else WHITE
    for ci, (val, w) in enumerate(zip([fase, dur, deliv], tl_col_w)):
        c = row.cells[ci]; c.width = w
        set_cell_bg(c, bg); set_cell_borders(c, BORDER_C)
        p_el = c.paragraphs[0]
        r = p_el.add_run(val)
        r.font.name = 'Calibri'; r.font.size = Pt(10)
        if ci == 0: r.font.bold = True

doc.add_paragraph()

# ── 11. ASSUMPTIONS & CONSTRAINTS ─────────────────────────────────────────────

h1('11. Assumptions & Constraints')
h2('Assumptions')
assumptions = [
    'Pengguna memiliki akses internet yang memadai untuk menggunakan aplikasi web.',
    'Mata uang default adalah Rupiah (IDR); dukungan multi-mata uang di luar scope v1.',
    'Satu household maksimal 10 anggota pada plan Freemium.',
    'Pengguna bertanggung jawab atas keakuratan data yang mereka masukkan.',
]
for a in assumptions:
    bullet(a)

h2('Constraints')
constraints = [
    'Budget pengembangan terbatas — prioritas pada fitur P0 untuk MVP.',
    'Tim kecil — arsitektur harus mendukung development yang cepat dan iteratif.',
    'Tidak ada integrasi bank di v1 — semua input manual oleh pengguna.',
]
for c in constraints:
    bullet(c)

doc.add_paragraph()

# ── 12. GLOSSARY ──────────────────────────────────────────────────────────────

h1('12. Glossary')
gloss = [
    ('Household',    'Unit keluarga dalam sistem; satu keluarga = satu Household.'),
    ('Admin',        'Pengguna dengan akses penuh dalam sebuah Household.'),
    ('Member',       'Anggota Household dengan akses terbatas (catat & lihat).'),
    ('Dompet',       'Akun keuangan virtual dalam satu Household (rekening, tunai, tabungan, dll).'),
    ('Transaksi',    'Setiap pencatatan pemasukan, pengeluaran, atau transfer.'),
    ('Budget',       'Batas anggaran yang ditetapkan per kategori per periode.'),
    ('SaaS',         'Software as a Service — perangkat lunak berbasis langganan melalui internet.'),
    ('RLS',          'Row Level Security — fitur PostgreSQL untuk isolasi data per pengguna/tenant.'),
    ('MVP',          'Minimum Viable Product — versi produk dengan fitur inti minimum yang siap diluncurkan.'),
]
gl_tbl = doc.add_table(rows=1 + len(gloss), cols=2)
gl_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = gl_tbl.rows[0]
for i, htxt in enumerate(['Istilah', 'Definisi']):
    c = hrow.cells[i]
    set_cell_bg(c, HEADER_BG); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    r.font.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
gl_col_w = [Cm(3), Cm(13.6)]
for ri, (term, defn) in enumerate(gloss):
    row = gl_tbl.rows[ri + 1]
    bg = ALT_ROW if ri % 2 == 0 else WHITE
    for ci, (val, w) in enumerate(zip([term, defn], gl_col_w)):
        c = row.cells[ci]; c.width = w
        set_cell_bg(c, bg); set_cell_borders(c, BORDER_C)
        p_el = c.paragraphs[0]
        r = p_el.add_run(val)
        r.font.name = 'Calibri'; r.font.size = Pt(10)
        if ci == 0: r.font.bold = True

doc.add_paragraph()

# ── FOOTER / SIGN-OFF ─────────────────────────────────────────────────────────

doc.add_page_break()
for _ in range(8):
    doc.add_paragraph()

sign_p = doc.add_paragraph()
sign_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr = sign_p.add_run('— Document End —')
sr.font.name = 'Calibri'; sr.font.size = Pt(10)
sr.font.italic = True; sr.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

ver_p = doc.add_paragraph()
ver_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
vr2 = ver_p.add_run('Maalify PRD v1.0.0  |  15 Mei 2026  |  Confidential')
vr2.font.name = 'Calibri'; vr2.font.size = Pt(9)
vr2.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)

# ── SAVE ──────────────────────────────────────────────────────────────────────

out = '/sessions/hopeful-exciting-feynman/mnt/outputs/Maalify_PRD_v1.0.docx'
doc.save(out)
print('Saved:', out)
