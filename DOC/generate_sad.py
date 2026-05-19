"""
Maalify — System Architecture Document Generator
Generates:
  1. maalify_architecture_diagram.png  (matplotlib)
  2. Maalify_SAD_v1.0.docx             (python-docx)
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import numpy as np

# ═══════════════════════════════════════════════════════════════════
#  COLOURS
# ═══════════════════════════════════════════════════════════════════
NAVY     = '#1E3A5F'
GREEN    = '#27AE60'
TEAL     = '#16A085'
ORANGE   = '#E67E22'
PURPLE   = '#8E44AD'
RED      = '#C0392B'
BLUE     = '#2471A3'
WHITE    = '#FFFFFF'
LGRAY    = '#F4F6F8'
DGRAY    = '#7F8C8D'
BORDER   = '#BDC3C7'

# ═══════════════════════════════════════════════════════════════════
#  ARCHITECTURE DIAGRAM
# ═══════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(20, 14))
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')
fig.patch.set_facecolor('#F8FAFB')
ax.set_facecolor('#F8FAFB')

# ── helpers ───────────────────────────────────────────────────────

def layer_band(ax, y, h, color, alpha=0.10, label='', label_x=0.25):
    ax.add_patch(FancyBboxPatch((0.2, y), 19.6, h,
        boxstyle='round,pad=0.1', linewidth=0.8,
        edgecolor=color, facecolor=color, alpha=alpha, zorder=0))
    if label:
        ax.text(label_x, y + h - 0.28, label,
                fontsize=7.5, color=color, style='italic',
                fontweight='bold', va='top', zorder=1)

def service_box(ax, x, y, w, h, title, subs, color, icon=''):
    # shadow
    ax.add_patch(FancyBboxPatch((x+0.07, y-0.07), w, h,
        boxstyle='round,pad=0.08', linewidth=0,
        facecolor='#BBBBBB', alpha=0.4, zorder=2))
    # main box
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle='round,pad=0.08', linewidth=1.5,
        edgecolor=color, facecolor=WHITE, zorder=3))
    # header strip
    ax.add_patch(FancyBboxPatch((x, y+h-0.55), w, 0.55,
        boxstyle='round,pad=0.0', linewidth=0,
        facecolor=color, zorder=4))
    # title
    ax.text(x + w/2, y + h - 0.275,
            (icon+' ' if icon else '') + title,
            ha='center', va='center', fontsize=8.5,
            fontweight='bold', color=WHITE, zorder=5)
    # sub-items
    for i, sub in enumerate(subs):
        ax.text(x + 0.18, y + h - 0.85 - i*0.38,
                '• ' + sub, ha='left', va='center',
                fontsize=7.2, color='#2C3E50', zorder=5)

def arrow(ax, x1, y1, x2, y2, color=BORDER, label='', bidirectional=False):
    style = '<->' if bidirectional else '->'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle=style, color=color,
                        lw=1.4, mutation_scale=12,
                        connectionstyle='arc3,rad=0.0'),
        zorder=6)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.1, my+0.1, label, fontsize=6.5,
                color=color, style='italic', zorder=7,
                bbox=dict(boxstyle='round,pad=0.15',
                          facecolor=WHITE, edgecolor='none', alpha=0.85))

# ── Title ─────────────────────────────────────────────────────────

ax.text(10, 13.65, 'Maalify — System Architecture Overview',
        ha='center', va='center', fontsize=15, fontweight='bold', color=NAVY)
ax.text(10, 13.28, 'v1.0  |  Next.js 14 + Supabase + Vercel  |  15 Mei 2026',
        ha='center', va='center', fontsize=9, color=DGRAY)

# ── Layer bands ───────────────────────────────────────────────────
layer_band(ax, 11.8, 1.3,  BLUE,   label='CLIENT LAYER')
layer_band(ax, 9.2,  2.3,  TEAL,   label='CDN & EDGE LAYER  (Vercel)')
layer_band(ax, 5.8,  3.1,  NAVY,   label='APPLICATION LAYER  (Vercel Serverless)')
layer_band(ax, 2.0,  3.5,  GREEN,  label='BACKEND LAYER  (Supabase)')
layer_band(ax, 0.3,  1.4,  ORANGE, label='EXTERNAL SERVICES')

# ── CLIENT LAYER ──────────────────────────────────────────────────
service_box(ax, 6.5, 12.0, 7.0, 1.0,
            'User Browser', ['React 18 + Next.js App Router', 'Tailwind CSS + shadcn/ui  |  Recharts'],
            BLUE)

# ── CDN / EDGE LAYER ──────────────────────────────────────────────
service_box(ax, 1.0, 9.5, 4.2, 1.8,
            'Vercel Edge Network', ['Global CDN (100+ PoPs)', 'Static assets (JS/CSS/img)', 'Edge caching'],
            TEAL)
service_box(ax, 6.2, 9.5, 4.2, 1.8,
            'Next.js Middleware', ['Auth session validation', 'Route protection', 'Redirect logic'],
            TEAL)
service_box(ax, 11.5, 9.5, 4.2, 1.8,
            'Vercel Analytics', ['Core Web Vitals', 'Page performance', 'Real-time traffic'],
            TEAL)

# ── APPLICATION LAYER ─────────────────────────────────────────────
service_box(ax, 1.0, 6.1, 4.2, 2.5,
            'Next.js App Router', ['Server Components (RSC)', 'Client Components', 'Dynamic routes', 'Server Actions'],
            NAVY)
service_box(ax, 6.2, 6.1, 4.2, 2.5,
            'API Routes', ['/api/transactions', '/api/wallets', '/api/budgets', '/api/reports'],
            NAVY)
service_box(ax, 11.5, 6.1, 4.2, 2.5,
            'Background Jobs', ['Recurring tx generator', 'Budget alert checker', 'Debt reminder sender'],
            NAVY)

# ── BACKEND LAYER (Supabase) ──────────────────────────────────────
service_box(ax, 0.5, 2.2, 3.2, 2.8,
            'Supabase Auth', ['Email + OAuth (Google)', 'JWT session token', 'Row-level policies'],
            GREEN)
service_box(ax, 4.3, 2.2, 3.6, 2.8,
            'PostgreSQL DB', ['14 tables + RLS', 'Indexes optimized', 'Point-in-time backup', 'Realtime subscriptions'],
            GREEN)
service_box(ax, 8.5, 2.2, 3.2, 2.8,
            'Supabase Storage', ['Transaction receipts', 'Avatar photos', 'Bucket policies', 'CDN delivery'],
            GREEN)
service_box(ax, 12.3, 2.2, 3.2, 2.8,
            'Edge Functions', ['Webhook handlers', 'Scheduled jobs', 'Complex business logic'],
            GREEN)
service_box(ax, 16.1, 2.2, 3.2, 2.8,
            'Sentry', ['Error tracking', 'Performance mon.', 'Alert & incidents'],
            PURPLE)

# ── EXTERNAL SERVICES ─────────────────────────────────────────────
service_box(ax, 1.5, 0.4, 3.5, 0.95,
            'Resend (Email)', ['Budget alerts', 'Debt reminders'],
            ORANGE)
service_box(ax, 6.5, 0.4, 3.5, 0.95,
            'Google OAuth', ['Social login', 'Account linking'],
            ORANGE)
service_box(ax, 11.5, 0.4, 3.5, 0.95,
            'Stripe (Future)', ['Payment gateway', 'Subscription billing'],
            ORANGE)
service_box(ax, 15.5, 0.4, 3.0, 0.95,
            'Uptime Robot', ['Uptime monitoring', 'Alerts on-call'],
            ORANGE)

# ── ARROWS ────────────────────────────────────────────────────────
# Client ↔ Edge
arrow(ax, 10.0, 12.0, 10.0, 11.3, BLUE, 'HTTPS', bidirectional=True)
# Edge → App
arrow(ax, 3.1, 9.5, 3.1, 8.6, TEAL, bidirectional=True)
arrow(ax, 8.3, 9.5, 8.3, 8.6, TEAL, bidirectional=True)
# App → Supabase
arrow(ax, 3.1, 6.1, 3.1, 5.0, NAVY, 'SDK', bidirectional=True)
arrow(ax, 8.3, 6.1, 6.1, 5.0, NAVY, 'SQL', bidirectional=True)
arrow(ax, 8.3, 6.1, 10.1, 5.0, NAVY, bidirectional=True)
arrow(ax, 13.6, 6.1, 13.6, 5.0, NAVY, bidirectional=True)
# Background → Supabase
arrow(ax, 13.6, 6.1, 6.1, 5.0, '#AAAAAA', bidirectional=False)
# Background → Email
arrow(ax, 13.6, 6.1, 3.3, 1.35, ORANGE, 'Email')
# Auth → DB
arrow(ax, 4.1, 3.6, 4.3, 3.6, GREEN, bidirectional=True)
# Sentry ← App
arrow(ax, 14.5, 6.1, 17.7, 5.0, PURPLE, 'Errors')
# External
arrow(ax, 3.2, 2.2, 3.2, 1.35, ORANGE, bidirectional=True)
arrow(ax, 8.3, 2.2, 8.3, 1.35, ORANGE, bidirectional=True)

plt.tight_layout(pad=0.3)
out_img = '/sessions/hopeful-exciting-feynman/mnt/outputs/maalify_architecture_diagram.png'
plt.savefig(out_img, dpi=180, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close()
print('Architecture diagram saved:', out_img)

# ═══════════════════════════════════════════════════════════════════
#  DOCX DOCUMENT
# ═══════════════════════════════════════════════════════════════════

from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()
for section in doc.sections:
    section.top_margin    = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)

doc.styles['Normal'].font.name = 'Calibri'
doc.styles['Normal'].font.size = Pt(10.5)

C_NAVY  = RGBColor(0x1E, 0x3A, 0x5F)
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
C_GRAY  = RGBColor(0x7F, 0x8C, 0x8D)
C_GREEN = RGBColor(0x27, 0xAE, 0x60)
HDR_HEX = '1E3A5F'
ALT_HEX = 'F4F6F8'
WHT_HEX = 'FFFFFF'
BRD_HEX = 'BDC3C7'

def set_cell_bg(cell, hexc):
    tc = cell._tc; tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'),'clear'); shd.set(qn('w:color'),'auto')
    shd.set(qn('w:fill'), hexc); tcPr.append(shd)

def set_cell_borders(cell, color=BRD_HEX):
    tc = cell._tc; tcPr = tc.get_or_add_tcPr()
    tcB = OxmlElement('w:tcBorders')
    for side in ('top','left','bottom','right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'),'single'); el.set(qn('w:sz'),'4')
        el.set(qn('w:space'),'0'); el.set(qn('w:color'), color)
        tcB.append(el)
    tcPr.append(tcB)

def h1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after  = Pt(6)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'),'single'); bot.set(qn('w:sz'),'6')
    bot.set(qn('w:space'),'1'); bot.set(qn('w:color'), HDR_HEX)
    pBdr.append(bot); pPr.append(pBdr)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(16)
    r.font.bold=True; r.font.color.rgb=C_NAVY
    return p

def h2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after  = Pt(4)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(12.5)
    r.font.bold=True; r.font.color.rgb=C_NAVY
    return p

def h3(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after  = Pt(3)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(11)
    r.font.bold=True; r.font.color.rgb=RGBColor(0x16,0xA0,0x85)
    return p

def body(text, after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(10.5)
    return p

def bullet(text, bold_part=''):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    if bold_part:
        rb = p.add_run(bold_part)
        rb.font.name='Calibri'; rb.font.size=Pt(10.5); rb.font.bold=True
        r = p.add_run(text)
    else:
        r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(10.5)
    return p

def info_box(text, border_color='2471A3'):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent  = Cm(0.5)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(6)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    for side in ('top','left','bottom','right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'),'single')
        el.set(qn('w:sz'),'8' if side=='left' else '4')
        el.set(qn('w:space'),'4')
        el.set(qn('w:color'), border_color)
        pBdr.append(el)
    pPr.append(pBdr)
    r = p.add_run(text)
    r.font.name='Calibri'; r.font.size=Pt(10); r.font.italic=True

def simple_table(headers, rows, col_widths):
    tbl = doc.add_table(rows=1+len(rows), cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
    hrow = tbl.rows[0]
    for i,(h,w) in enumerate(zip(headers, col_widths)):
        c = hrow.cells[i]; c.width = w
        set_cell_bg(c, HDR_HEX); set_cell_borders(c)
        p_el = c.paragraphs[0]
        r = p_el.add_run(h)
        r.font.name='Calibri'; r.font.size=Pt(10.5)
        r.font.bold=True; r.font.color.rgb=C_WHITE
    for ri, row_data in enumerate(rows):
        row = tbl.rows[ri+1]
        bg = ALT_HEX if ri%2==0 else WHT_HEX
        for ci,(val,w) in enumerate(zip(row_data, col_widths)):
            c = row.cells[ci]; c.width=w
            set_cell_bg(c, bg); set_cell_borders(c, BRD_HEX)
            p_el = c.paragraphs[0]
            r = p_el.add_run(val if val else '')
            r.font.name='Calibri'; r.font.size=Pt(10)
    doc.add_paragraph()

# ── COVER PAGE ────────────────────────────────────────────────────

for _ in range(4): doc.add_paragraph()
tp = doc.add_paragraph(); tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr = tp.add_run('SYSTEM ARCHITECTURE DOCUMENT')
tr.font.name='Calibri'; tr.font.size=Pt(26); tr.font.bold=True; tr.font.color.rgb=C_NAVY

doc.add_paragraph()
sp = doc.add_paragraph(); sp.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr = sp.add_run('Maalify')
sr.font.name='Calibri'; sr.font.size=Pt(20); sr.font.bold=True; sr.font.color.rgb=C_GREEN

sp2 = doc.add_paragraph(); sp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr2 = sp2.add_run('Platform Pencatatan Keuangan Keluarga (SaaS)')
sr2.font.name='Calibri'; sr2.font.size=Pt(13)
sr2.font.color.rgb = RGBColor(0x55,0x55,0x55)

for _ in range(2): doc.add_paragraph()

meta_t = doc.add_table(rows=6, cols=2)
meta_t.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in meta_t.rows:
    for cell in row.cells:
        tc = cell._tc; tcPr = tc.get_or_add_tcPr()
        tcB = OxmlElement('w:tcBorders')
        for side in ('top','left','bottom','right'):
            el = OxmlElement(f'w:{side}'); el.set(qn('w:val'),'nil'); tcB.append(el)
        tcPr.append(tcB)

meta_vals = [
    ('Versi','v1.0.0'), ('Tanggal','15 Mei 2026'), ('Status','Draft'),
    ('Penulis','Rizman'),
    ('Stack Utama','Next.js 14 + Supabase + Vercel'),
    ('Dokumen Terkait','Maalify PRD v1.0 | Maalify ERD v1.0'),
]
for i,(k,v) in enumerate(meta_vals):
    row = meta_t.rows[i]
    lp = row.cells[0].paragraphs[0]; lp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    lr = lp.add_run(k+' :')
    lr.font.name='Calibri'; lr.font.size=Pt(10.5); lr.font.bold=True; lr.font.color.rgb=C_NAVY
    vp = row.cells[1].paragraphs[0]
    vr = vp.add_run('  '+v)
    vr.font.name='Calibri'; vr.font.size=Pt(10.5)

doc.add_page_break()

# ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────────

h1('1. Executive Summary')
body(
    'Dokumen ini mendeskripsikan arsitektur teknikal keseluruhan sistem Maalify — '
    'platform SaaS pencatatan keuangan keluarga berbasis web. Dokumen ini menjadi '
    'rujukan utama untuk tim pengembang, DevOps, dan stakeholder teknikal dalam '
    'memahami bagaimana komponen-komponen sistem berinteraksi, keputusan teknologi '
    'yang diambil, dan alasan di balik setiap pilihan arsitektur.'
)
info_box(
    'Arsitektur Maalify dirancang mengikuti prinsip: Simplicity First — '
    'pilih stack yang paling produktif untuk tim kecil, bukan yang paling kompleks. '
    'Semua komponen dapat di-scale secara independen seiring pertumbuhan pengguna.'
)

# ── 2. ARCHITECTURE OVERVIEW ──────────────────────────────────────

h1('2. Architecture Overview')

h2('2.1 Architectural Pattern')
body(
    'Maalify menggunakan pola arsitektur Serverless Full-Stack dengan pendekatan '
    'Backend-as-a-Service (BaaS). Pilihan ini memungkinkan tim kecil untuk '
    'bergerak cepat tanpa harus mengelola infrastruktur server secara manual.'
)

simple_table(
    ['Aspek', 'Keputusan', 'Alasan'],
    [
        ('Pattern',     'Serverless + BaaS',        'Minimal ops overhead, auto-scaling built-in'),
        ('Rendering',   'SSR + CSR hybrid (Next.js)','SEO-friendly + interaktif seperti SPA'),
        ('API',         'REST via Next.js API Routes','Simple, well-understood, cepat dikembangkan'),
        ('Database',    'Managed PostgreSQL',         'ACID compliance, RLS built-in, familiar'),
        ('Multi-tenant','Shared DB + RLS',            'Cost-efficient untuk early stage SaaS'),
        ('Auth',        'JWT + Session (Supabase)',   'Secure, stateless, terintegrasi dengan DB'),
    ],
    [Cm(3), Cm(4.5), Cm(9.1)]
)

h2('2.2 Architecture Diagram')
body('Diagram berikut menunjukkan semua layer sistem dan bagaimana komponen-komponen berinteraksi:')
doc.add_paragraph()
p_img = doc.add_paragraph(); p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_img.add_run().add_picture(out_img, width=Cm(16.5))
cap = doc.add_paragraph(); cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
cr = cap.add_run('Gambar 1 — Maalify System Architecture v1.0')
cr.font.name='Calibri'; cr.font.size=Pt(9); cr.font.italic=True; cr.font.color.rgb=C_GRAY
doc.add_page_break()

# ── 3. LAYER-BY-LAYER BREAKDOWN ───────────────────────────────────

h1('3. Layer-by-Layer Breakdown')

# --- CLIENT LAYER ---
h2('3.1 Client Layer')
body(
    'Pengguna mengakses Maalify melalui browser modern. Aplikasi dirender '
    'menggunakan React 18 dengan Next.js App Router, memberikan pengalaman '
    'yang cepat dan responsif baik di desktop maupun mobile browser.'
)
h3('Stack Frontend')
simple_table(
    ['Teknologi', 'Versi', 'Fungsi'],
    [
        ('Next.js',      '14 (App Router)', 'Framework React utama, SSR + CSR hybrid'),
        ('React',        '18',              'UI library, Server Components + Client Components'),
        ('Tailwind CSS', '3.x',             'Utility-first CSS, responsive design system'),
        ('shadcn/ui',    'Latest',          'Komponen UI pre-built (forms, modals, tables)'),
        ('Recharts',     '2.x',             'Library grafik untuk dashboard (line, pie, bar chart)'),
        ('React Query',  '5.x',             'Server state management, caching, background refetch'),
        ('Zustand',      '4.x',             'Client state management (UI state, filters)'),
        ('React Hook Form','7.x',           'Form handling dan validasi yang performant'),
        ('Zod',          '3.x',             'Schema validation (frontend + API types)'),
    ],
    [Cm(3.5), Cm(2.5), Cm(10.6)]
)

h3('Rendering Strategy')
bullet('Server Components (RSC): ', 'Halaman dashboard, laporan, list transaksi — data diambil langsung di server, tidak butuh loading state.')
bullet('Client Components: ', 'Form input transaksi, modal, grafik interaktif — butuh event handler browser.')
bullet('Server Actions: ', 'Mutasi data (create/update/delete) langsung dari komponen tanpa API call manual.')

doc.add_paragraph()

# --- CDN / EDGE LAYER ---
h2('3.2 CDN & Edge Layer')
body(
    'Vercel bertindak sebagai platform deployment sekaligus CDN global. '
    'Static assets (JavaScript bundle, CSS, gambar) disajikan dari edge node '
    'terdekat dengan pengguna untuk meminimalkan latency.'
)
h3('Komponen Edge')
simple_table(
    ['Komponen', 'Fungsi'],
    [
        ('Vercel Edge Network',   'CDN global 100+ PoP, distribusi static assets'),
        ('Next.js Middleware',    'Validasi session JWT, proteksi route, redirect unauthenticated user'),
        ('Vercel Analytics',      'Core Web Vitals monitoring, real-time traffic dashboard'),
        ('Automatic HTTPS',       'SSL certificate otomatis, HTTP→HTTPS redirect'),
        ('Image Optimization',    'Next.js `<Image>` komponen, WebP conversion, lazy loading otomatis'),
    ],
    [Cm(4.5), Cm(12.1)]
)

doc.add_paragraph()

# --- APPLICATION LAYER ---
h2('3.3 Application Layer')
body(
    'Aplikasi berjalan sebagai Serverless Functions di Vercel. '
    'Setiap API route di-deploy sebagai fungsi independen yang auto-scale '
    'berdasarkan traffic tanpa konfigurasi manual.'
)

h3('Struktur Direktori (Next.js App Router)')
code_p = doc.add_paragraph()
code_p.paragraph_format.left_indent  = Cm(1)
code_p.paragraph_format.space_after  = Pt(6)
code_lines = [
    'maalify/',
    '├── app/',
    '│   ├── (auth)/          → Login, Register, Forgot Password',
    '│   ├── (dashboard)/     → Protected routes (household required)',
    '│   │   ├── dashboard/   → Overview & charts',
    '│   │   ├── transactions/→ List & CRUD transaksi',
    '│   │   ├── wallets/     → Manajemen dompet',
    '│   │   ├── budgets/     → Budget per kategori',
    '│   │   ├── debts/       → Hutang & piutang',
    '│   │   └── reports/     → Laporan bulanan & export',
    '│   └── api/             → REST API endpoints',
    '│       ├── transactions/',
    '│       ├── wallets/',
    '│       ├── categories/',
    '│       ├── budgets/',
    '│       └── reports/',
    '├── components/          → Reusable UI components',
    '├── lib/                 → Supabase client, utilities, helpers',
    '└── types/               → TypeScript types & Zod schemas',
]
for line in code_lines:
    cr2 = code_p.add_run(line + '\n')
    cr2.font.name = 'Courier New'; cr2.font.size = Pt(9); cr2.font.color.rgb = RGBColor(0x2C,0x3E,0x50)

h3('API Design Conventions')
simple_table(
    ['Method', 'Pattern', 'Contoh', 'Fungsi'],
    [
        ('GET',    '/api/{resource}',        '/api/transactions',       'List semua resource'),
        ('GET',    '/api/{resource}/{id}',   '/api/transactions/123',   'Get satu resource'),
        ('POST',   '/api/{resource}',        '/api/transactions',       'Create resource baru'),
        ('PATCH',  '/api/{resource}/{id}',   '/api/transactions/123',   'Update sebagian field'),
        ('DELETE', '/api/{resource}/{id}',   '/api/transactions/123',   'Hapus resource'),
    ],
    [Cm(2.0), Cm(4.0), Cm(4.0), Cm(6.6)]
)

h3('Background Jobs')
body(
    'Proses yang berjalan di background dihandle oleh Supabase Edge Functions '
    'yang dipicu secara terjadwal (cron) via pg_cron:'
)
simple_table(
    ['Job', 'Jadwal', 'Fungsi'],
    [
        ('generate_recurring_transactions', 'Setiap hari 00:05 WIB', 'Generate transaksi dari template recurring_transactions'),
        ('check_budget_alerts',             'Setiap jam',            'Cek pengeluaran vs budget, kirim notifikasi jika ≥ 80%'),
        ('send_debt_reminders',             'Setiap hari 08:00 WIB', 'Kirim reminder email hutang H-7 dan H-1'),
        ('update_debt_status',              'Setiap hari 01:00 WIB', 'Update status hutang ke overdue jika lewat due_date'),
    ],
    [Cm(5.5), Cm(3.5), Cm(7.6)]
)

doc.add_page_break()

# --- BACKEND LAYER ---
h2('3.4 Backend Layer (Supabase)')
body(
    'Supabase berperan sebagai backend lengkap Maalify. '
    'Platform ini menyediakan PostgreSQL database, authentication, file storage, '
    'dan serverless edge functions dalam satu bundle terintegrasi.'
)

h3('3.4.1 Supabase Auth')
body(
    'Semua proses autentikasi dihandle oleh Supabase Auth. '
    'Pengguna login menggunakan email/password atau Google OAuth. '
    'Setelah login, Supabase mengeluarkan JWT token yang dikirim '
    'ke setiap API request melalui Authorization header.'
)
simple_table(
    ['Fitur Auth', 'Detail'],
    [
        ('Email/Password',     'Registrasi dengan verifikasi email wajib sebelum akses penuh'),
        ('Google OAuth',       'Login satu klik via Google, auto-create akun baru'),
        ('JWT Token',          'Access token (1 jam) + Refresh token (30 hari), dirotasi otomatis'),
        ('Session Management', 'Supabase JS client mengelola token refresh secara otomatis'),
        ('Password Reset',     'Email magic link untuk reset password'),
        ('RLS Integration',    'auth.uid() tersedia di setiap query PostgreSQL untuk RLS policy'),
    ],
    [Cm(3.8), Cm(12.8)]
)

h3('3.4.2 PostgreSQL Database')
body(
    'Database PostgreSQL dikelola sepenuhnya oleh Supabase dengan fitur-fitur enterprise '
    'yang tersedia di semua plan.'
)
simple_table(
    ['Fitur DB', 'Implementasi di Maalify'],
    [
        ('Row Level Security (RLS)',     'Setiap tabel punya policy: user hanya bisa akses data Household-nya'),
        ('Realtime Subscriptions',       'Dashboard update otomatis jika anggota lain catat transaksi baru'),
        ('Database Triggers',            'Auto-update current_balance di wallets setiap ada transaksi baru'),
        ('pg_cron',                      'Scheduled jobs untuk generate recurring transactions & alerts'),
        ('Full-text Search',             'Pencarian transaksi by description menggunakan tsvector'),
        ('Point-in-time Recovery',       'Backup continuous, bisa restore ke detik manapun dalam 30 hari'),
        ('Connection Pooling (pgBouncer)','Handle ribuan concurrent connections dengan efisien'),
    ],
    [Cm(5.0), Cm(11.6)]
)

h3('3.4.3 Supabase Storage')
body(
    'File lampiran transaksi (foto struk, nota) disimpan di Supabase Storage '
    'dengan struktur bucket yang terorganisir dan access policy yang ketat.'
)
simple_table(
    ['Bucket', 'Konten', 'Access Policy'],
    [
        ('avatars',      'Foto profil pengguna',        'Public read, auth write (own file only)'),
        ('receipts',     'Lampiran bukti transaksi',    'Private — hanya anggota Household yang sama'),
    ],
    [Cm(2.8), Cm(5.8), Cm(8.0)]
)

h3('3.4.4 Database Triggers (Auto-update Saldo)')
body(
    'Saldo wallet (current_balance) tidak perlu dihitung manual di aplikasi. '
    'PostgreSQL trigger memastikan saldo selalu konsisten secara otomatis:'
)
bullet('INSERT transaksi income → ', 'current_balance += amount pada wallet terkait')
bullet('INSERT transaksi expense → ', 'current_balance -= amount pada wallet terkait')
bullet('INSERT transfer → ', 'from_wallet.current_balance -= amount, to_wallet.current_balance += amount')
bullet('DELETE / UPDATE transaksi → ', 'Trigger reversal dan re-apply nilai baru')
bullet('INSERT debt_payment → ', 'debts.remaining_amount -= amount secara otomatis')

doc.add_paragraph()

# --- EXTERNAL SERVICES ---
h2('3.5 External Services')
simple_table(
    ['Service', 'Provider', 'Fungsi', 'Integrasi'],
    [
        ('Email Transaksional', 'Resend',      'Kirim alert budget, reminder hutang, welcome email', 'API call dari Supabase Edge Function'),
        ('OAuth Provider',      'Google',      'Social login untuk kemudahan registrasi',            'Supabase Auth built-in provider'),
        ('Error Tracking',      'Sentry',      'Monitor runtime error di frontend dan API routes',   'Sentry SDK di Next.js'),
        ('Payment Gateway',     'Stripe',      'Billing langganan — FUTURE SCOPE, belum v1',        'Supabase Webhook + Stripe Events'),
        ('Uptime Monitoring',   'Uptime Robot','Monitor ketersediaan endpoint publik, alert tim',    'External ping setiap 5 menit'),
    ],
    [Cm(3.5), Cm(2.8), Cm(5.5), Cm(4.8)]
)

doc.add_page_break()

# ── 4. SECURITY ARCHITECTURE ──────────────────────────────────────

h1('4. Security Architecture')
body(
    'Keamanan dirancang berlapis (defence-in-depth) — '
    'setiap layer memiliki mekanisme perlindungan sendiri.'
)

h2('4.1 Authentication & Authorization')
simple_table(
    ['Layer', 'Mekanisme', 'Detail'],
    [
        ('Transport',      'HTTPS/TLS 1.3',       'Semua komunikasi dienkripsi; HTTP auto-redirect ke HTTPS'),
        ('Authentication', 'JWT (Supabase Auth)',  'Token expire 1 jam, refresh token 30 hari, rotasi otomatis'),
        ('Authorization',  'Row Level Security',  'Database-level policy, tidak bisa di-bypass dari aplikasi'),
        ('Middleware',     'Next.js Middleware',   'Validasi session sebelum setiap request ke protected route'),
        ('API Routes',     'Server-side validation','Setiap API route validasi token dan membership Household'),
    ],
    [Cm(3.0), Cm(3.8), Cm(9.8)]
)

h2('4.2 Data Security')
bullet('Enkripsi at-rest: ', 'Database dan Storage Supabase dienkripsi AES-256 secara default.')
bullet('Enkripsi in-transit: ', 'TLS 1.3 untuk semua koneksi client-server dan server-database.')
bullet('Password hashing: ', 'Bcrypt dengan salt, dikelola sepenuhnya oleh Supabase Auth.')
bullet('Input validation: ', 'Zod schema validation di frontend dan API routes untuk cegah injection.')
bullet('SQL injection prevention: ', 'Semua query menggunakan Supabase client dengan parameterized queries.')
bullet('File upload validation: ', 'MIME type check, size limit (5MB), scan di server sebelum disimpan.')
bullet('Environment variables: ', 'Secret key tidak pernah di-commit ke repo; dikelola via Vercel env vars.')

doc.add_paragraph()

h2('4.3 Multi-Tenant Isolation')
info_box(
    'Maalify menggunakan Shared Database Multi-Tenancy dengan Row Level Security. '
    'Pendekatan ini lebih cost-efficient dibanding database-per-tenant pada skala awal, '
    'dengan isolasi data yang dijamin oleh PostgreSQL pada level query.'
)
simple_table(
    ['Aspek', 'Pendekatan', 'Implementasi'],
    [
        ('Data Isolation',  'RLS per Household',     'auth.uid() IN (SELECT user_id FROM household_members WHERE household_id = ...)'),
        ('API Isolation',   'Server-side check',     'Setiap API route verifikasi user adalah anggota Household yang diminta'),
        ('Storage Isolation','Bucket + RLS',          'Supabase Storage policy terikat pada household_id file metadata'),
        ('Migration Path',  'Schema-per-tenant',     'Jika > 10.000 tenant, pertimbangkan migrasi ke schema isolation'),
    ],
    [Cm(3.2), Cm(3.5), Cm(9.9)]
)

doc.add_page_break()

# ── 5. DATA FLOW ──────────────────────────────────────────────────

h1('5. Key Data Flows')

h2('5.1 Alur: User Login')
flows_login = [
    ('1', 'User',         'Masukkan email + password di halaman login'),
    ('2', 'Next.js',      'Submit form → POST /api/auth/login'),
    ('3', 'Supabase Auth','Verifikasi credentials, generate JWT + Refresh Token'),
    ('4', 'Next.js',      'Simpan token di secure HTTP-only cookie'),
    ('5', 'Middleware',   'Setiap request selanjutnya: validasi cookie, decode JWT'),
    ('6', 'User',         'Diarahkan ke halaman Dashboard'),
]
simple_table(['Step','Aktor','Aksi'], flows_login, [Cm(1.5), Cm(3.0), Cm(12.1)])

h2('5.2 Alur: Catat Transaksi Baru')
flows_tx = [
    ('1', 'User',        'Isi form transaksi (nominal, kategori, dompet, tanggal)'),
    ('2', 'React',       'Validasi Zod schema di client-side sebelum submit'),
    ('3', 'API Route',   'POST /api/transactions — validasi token, cek membership Household'),
    ('4', 'PostgreSQL',  'INSERT ke tabel transactions'),
    ('5', 'DB Trigger',  'Auto-update current_balance pada wallet terkait'),
    ('6', 'Realtime',    'Supabase broadcast perubahan ke semua anggota yang sedang online'),
    ('7', 'Dashboard',   'Komponen dashboard update otomatis via React Query invalidation'),
]
simple_table(['Step','Aktor','Aksi'], flows_tx, [Cm(1.5), Cm(3.0), Cm(12.1)])

h2('5.3 Alur: Alert Budget Terlampaui')
flows_budget = [
    ('1', 'pg_cron',         'Job check_budget_alerts dijalankan setiap jam'),
    ('2', 'PostgreSQL',      'Query: bandingkan SUM(transactions.amount) vs budgets.amount per kategori'),
    ('3', 'Edge Function',   'Identifikasi budget yang sudah ≥ 80% terpakai'),
    ('4', 'notifications',   'INSERT notifikasi baru ke tabel notifications'),
    ('5', 'Resend API',      'Kirim email peringatan ke email Admin Household'),
    ('6', 'Dashboard',       'Badge notifikasi muncul di header saat user buka aplikasi'),
]
simple_table(['Step','Aktor','Aksi'], flows_budget, [Cm(1.5), Cm(3.0), Cm(12.1)])

doc.add_page_break()

# ── 6. INFRASTRUCTURE & DEPLOYMENT ───────────────────────────────

h1('6. Infrastructure & Deployment')

h2('6.1 Deployment Architecture')
body(
    'Maalify sepenuhnya memanfaatkan platform managed cloud — tidak ada server '
    'yang perlu dikelola tim secara langsung. Setiap push ke branch main '
    'otomatis memicu deployment baru ke Vercel.'
)
simple_table(
    ['Komponen', 'Provider', 'Region', 'Plan'],
    [
        ('Frontend + API', 'Vercel',   'Global (CDN) + SIN1 (Singapore)', 'Pro'),
        ('Database',       'Supabase', 'ap-southeast-1 (Singapore)',       'Pro'),
        ('Storage',        'Supabase', 'ap-southeast-1 (Singapore)',       'Included in Pro'),
        ('Auth',           'Supabase', 'ap-southeast-1 (Singapore)',       'Included in Pro'),
        ('Email',          'Resend',   'Global',                           'Starter (Free 3000/mo)'),
        ('Error Tracking', 'Sentry',   'Global',                           'Developer (Free)'),
    ],
    [Cm(3.5), Cm(2.8), Cm(5.2), Cm(5.1)]
)

h2('6.2 CI/CD Pipeline')
body('Alur deployment otomatis dari code ke production:')
pipeline_steps = [
    ('Developer push code', 'git push ke branch feature/*'),
    ('GitHub PR',           'Buat Pull Request ke branch main'),
    ('Vercel Preview',      'Vercel otomatis build & deploy ke URL preview unik'),
    ('Review & Approve',    'Code review + QA di preview URL'),
    ('Merge to main',       'PR di-merge ke branch main'),
    ('Vercel Production',   'Auto-deploy ke production URL (maalify.app)'),
    ('Health Check',        'Uptime Robot verifikasi endpoint dalam 5 menit'),
]
simple_table(['Langkah', 'Detail'], pipeline_steps, [Cm(4.5), Cm(12.1)])

h2('6.3 Environment Strategy')
simple_table(
    ['Environment', 'Branch', 'URL', 'Database'],
    [
        ('Development', 'feature/*',   'localhost:3000',          'Supabase local (docker)'),
        ('Preview',     'any PR',      'maalify-<hash>.vercel.app','Supabase Staging project'),
        ('Production',  'main',        'app.maalify.com',         'Supabase Production project'),
    ],
    [Cm(2.8), Cm(2.5), Cm(5.5), Cm(5.8)]
)

doc.add_page_break()

# ── 7. SCALABILITY ────────────────────────────────────────────────

h1('7. Scalability & Performance')

h2('7.1 Performance Targets')
simple_table(
    ['Metrik', 'Target', 'Strategi'],
    [
        ('Page Load Time',   '< 2s (4G)',    'SSR + static generation, CDN caching, image optimization'),
        ('API Response',     '< 500ms P95',  'DB indexes, connection pooling, server components'),
        ('Time to Interactive','< 3s',       'Code splitting, lazy loading, React Suspense'),
        ('Core Web Vitals',  'All Green',    'Next.js Image, font optimization, minimal JS bundle'),
        ('Database Query',   '< 100ms P99',  'Proper indexes, RLS-aware queries, pgBouncer pooling'),
    ],
    [Cm(3.8), Cm(2.8), Cm(10.0)]
)

h2('7.2 Caching Strategy')
simple_table(
    ['Layer', 'Mekanisme', 'TTL', 'Konten'],
    [
        ('CDN',       'Vercel Edge Cache',     'Stale-while-revalidate', 'Static pages, assets'),
        ('Server',    'Next.js Full Route Cache','Per revalidation tag',  'Dashboard data, reports'),
        ('Client',    'React Query',            '5 menit (stale time)',   'API responses di browser'),
        ('Database',  'PostgreSQL shared_buffers','In-memory',            'Frequently accessed rows'),
    ],
    [Cm(2.2), Cm(4.0), Cm(3.8), Cm(6.6)]
)

h2('7.3 Scaling Roadmap')
simple_table(
    ['Fase', 'Threshold', 'Action'],
    [
        ('Early Stage',   '0 – 5.000 household',   'Current architecture, Supabase Pro cukup'),
        ('Growth Stage',  '5.000 – 50.000 household','Upgrade Supabase plan, read replicas untuk laporan'),
        ('Scale Stage',   '50.000+ household',      'Evaluasi schema-per-tenant, dedicated DB per region'),
        ('Enterprise',    '500.000+ household',     'Kubernetes, dedicated infra, custom sharding strategy'),
    ],
    [Cm(3.0), Cm(4.5), Cm(9.1)]
)

doc.add_page_break()

# ── 8. OBSERVABILITY ──────────────────────────────────────────────

h1('8. Observability & Monitoring')

h2('8.1 Monitoring Stack')
simple_table(
    ['Layer', 'Tool', 'Yang Dipantau'],
    [
        ('Frontend Performance', 'Vercel Analytics',   'Core Web Vitals, page load, traffic breakdown'),
        ('Error Tracking',       'Sentry',             'JS errors, API errors, stack traces, user context'),
        ('Database',             'Supabase Dashboard', 'Query performance, active connections, DB size'),
        ('Uptime',               'Uptime Robot',       'HTTP endpoint check setiap 5 menit, alert via email'),
        ('Logs',                 'Vercel Logs',        'API route logs, build logs, serverless function logs'),
        ('Alerts',               'Sentry + Uptime Robot','Email/Slack alert saat error spike atau downtime'),
    ],
    [Cm(4.0), Cm(3.8), Cm(8.8)]
)

h2('8.2 Alert Thresholds')
simple_table(
    ['Kondisi', 'Threshold', 'Notifikasi'],
    [
        ('Downtime',           'Endpoint tidak response > 1 menit', 'Email + Slack tim'),
        ('Error Rate Spike',   '> 5% request error dalam 5 menit',  'Sentry alert ke lead dev'),
        ('Slow API',           'P95 latency > 2 detik',             'Sentry performance alert'),
        ('DB Connection High', '> 80% connection pool used',        'Supabase alert email'),
        ('Storage Usage',      '> 80% quota used',                  'Manual review bulanan'),
    ],
    [Cm(4.5), Cm(5.0), Cm(7.1)]
)

doc.add_page_break()

# ── 9. TECHNICAL DECISIONS ────────────────────────────────────────

h1('9. Architecture Decision Records (ADR)')
body(
    'Bagian ini mendokumentasikan keputusan arsitektur penting beserta '
    'konteks dan alasan di balik setiap keputusan.'
)

adrs = [
    ('ADR-001', 'Gunakan Supabase sebagai backend utama',
     'Tim kecil, tidak ada DevOps dedicated. Butuh auth, database, storage, realtime dalam satu paket.',
     'Supabase menyediakan semua kebutuhan backend dengan DX (Developer Experience) yang sangat baik. PostgreSQL memberikan fondasi yang solid untuk scale ke depan. Alternatif (Firebase, PlanetScale + custom auth) lebih kompleks untuk dikonfigurasi.',
     'Lock-in vendor cukup tinggi. Migration plan: Supabase menggunakan PostgreSQL standar, sehingga bisa migrasi ke PostgreSQL self-hosted jika diperlukan.'),

    ('ADR-002', 'Shared Database Multi-Tenancy dengan RLS',
     'Pilih strategi multi-tenancy: separate database, schema-per-tenant, atau shared database.',
     'Shared DB + RLS dipilih karena: (1) paling murah di early stage, (2) PostgreSQL RLS memberikan isolasi yang kuat, (3) operasional paling sederhana. Database-per-tenant terlalu mahal untuk ratusan household kecil.',
     'Perlu migrasi jika ada household besar (enterprise) yang butuh dedicated resource. Migration path sudah direncanakan di scalability roadmap.'),

    ('ADR-003', 'Next.js App Router (bukan Pages Router)',
     'Next.js 14 memperkenalkan App Router yang berbeda signifikan dari Pages Router.',
     'App Router dipilih karena: (1) React Server Components mengurangi JS bundle yang dikirim ke client, (2) Streaming dan Suspense built-in untuk loading states yang lebih baik, (3) Ini masa depan Next.js — investasi jangka panjang.',
     'Learning curve lebih tinggi, ekosistem library belum semua kompatibel. Mitigasi: gunakan adapter/wrapper untuk library yang belum support RSC.'),

    ('ADR-004', 'REST API (bukan GraphQL atau tRPC)',
     'Pilih API paradigma untuk komunikasi frontend-backend.',
     'REST dipilih karena: (1) Tim familiar dengan REST, (2) Supabase sudah punya PostgREST built-in yang bisa digunakan langsung untuk operasi CRUD sederhana, (3) Kompleksitas GraphQL tidak justified untuk scope v1.',
     'Untuk query yang kompleks (laporan lintas tabel), REST bisa verbose. Solusi: gunakan Supabase client langsung di Server Components untuk query kompleks.'),
]

for adr_id, title, context, decision, consequence in adrs:
    h2(f'{adr_id}: {title}')
    p = doc.add_paragraph()
    r = p.add_run('Konteks: ')
    r.font.bold=True; r.font.name='Calibri'; r.font.size=Pt(10.5)
    r2 = p.add_run(context)
    r2.font.name='Calibri'; r2.font.size=Pt(10.5)

    p2 = doc.add_paragraph()
    r3 = p2.add_run('Keputusan: ')
    r3.font.bold=True; r3.font.name='Calibri'; r3.font.size=Pt(10.5)
    r4 = p2.add_run(decision)
    r4.font.name='Calibri'; r4.font.size=Pt(10.5)

    p3 = doc.add_paragraph()
    r5 = p3.add_run('Konsekuensi: ')
    r5.font.bold=True; r5.font.name='Calibri'; r5.font.size=Pt(10.5)
    r5.font.color.rgb = RGBColor(0xC0,0x39,0x2B)
    r6 = p3.add_run(consequence)
    r6.font.name='Calibri'; r6.font.size=Pt(10.5)
    doc.add_paragraph()

doc.add_page_break()

# ── 10. DISASTER RECOVERY ─────────────────────────────────────────

h1('10. Disaster Recovery & Business Continuity')

h2('10.1 Backup Strategy')
simple_table(
    ['Data', 'Backup Method', 'Retention', 'RTO'],
    [
        ('PostgreSQL',       'Supabase PITR (continuous)', '30 hari',   '< 1 jam'),
        ('Storage files',    'Supabase Storage redundancy', '30 hari',   '< 2 jam'),
        ('Environment Config','Vercel env vars + Git repo', 'Indefinite','< 30 menit'),
        ('Source Code',      'GitHub (main + tags)',        'Indefinite','< 15 menit'),
    ],
    [Cm(3.5), Cm(4.5), Cm(2.5), Cm(6.1)]
)

h2('10.2 Incident Response')
simple_table(
    ['Severity', 'Definisi', 'Response Time', 'Escalation'],
    [
        ('P0 - Critical', 'Aplikasi tidak bisa diakses sama sekali', '< 15 menit', 'Immediate — semua tim'),
        ('P1 - High',     'Fitur utama tidak berfungsi (transaksi)',  '< 1 jam',   'Lead dev + PM'),
        ('P2 - Medium',   'Fitur sekunder terganggu',                 '< 4 jam',   'Lead dev'),
        ('P3 - Low',      'Bug minor, UI issue',                      '< 24 jam',  'Developer yang tersedia'),
    ],
    [Cm(2.8), Cm(4.5), Cm(3.2), Cm(6.1)]
)

doc.add_paragraph()

# ── Sign-off ──────────────────────────────────────────────────────

doc.add_page_break()
for _ in range(8): doc.add_paragraph()
ep = doc.add_paragraph(); ep.alignment = WD_ALIGN_PARAGRAPH.CENTER
er = ep.add_run('— Document End —')
er.font.name='Calibri'; er.font.size=Pt(10); er.font.italic=True; er.font.color.rgb=C_GRAY
vp = doc.add_paragraph(); vp.alignment = WD_ALIGN_PARAGRAPH.CENTER
vr = vp.add_run('Maalify SAD v1.0.0  |  15 Mei 2026  |  Confidential')
vr.font.name='Calibri'; vr.font.size=Pt(9); vr.font.color.rgb=C_GRAY

# ── SAVE ──────────────────────────────────────────────────────────

out_doc = '/sessions/hopeful-exciting-feynman/mnt/outputs/Maalify_SAD_v1.0.docx'
doc.save(out_doc)
print('Document saved:', out_doc)
