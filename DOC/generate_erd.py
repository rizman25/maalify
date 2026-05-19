"""
Maalify ERD Generator
Generates:
  1. erd_diagram.png  — visual ERD (matplotlib)
  2. Maalify_ERD_v1.0.docx — full ERD document (python-docx)
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

# ═══════════════════════════════════════════════════════════════════
#  COLOURS
# ═══════════════════════════════════════════════════════════════════
NAVY      = '#1E3A5F'
GREEN     = '#27AE60'
TEAL      = '#16A085'
ORANGE    = '#E67E22'
WHITE     = '#FFFFFF'
LIGHT     = '#F4F6F8'
BORDER    = '#BDC3C7'
PK_COL    = '#C0392B'
FK_COL    = '#2471A3'
ATTR_COL  = '#2C3E50'
GRAY_TEXT = '#7F8C8D'

BOX_W     = 3.6
ROW_H     = 0.48
HDR_H     = 0.70

# ═══════════════════════════════════════════════════════════════════
#  ENTITY DATA   (name, attrs[(label, type, pk, fk)], (x,y_top), color)
# ═══════════════════════════════════════════════════════════════════
ENTITIES = {
    'users': {
        'color': NAVY,
        'pos': (2.2, 19.0),
        'attrs': [
            ('id',         'UUID',      True,  False),
            ('email',      'VARCHAR',   False, False),
            ('name',       'VARCHAR',   False, False),
            ('avatar_url', 'TEXT',      False, False),
            ('created_at', 'TIMESTAMPZ',False, False),
        ],
    },
    'household_members': {
        'color': TEAL,
        'pos': (6.8, 19.0),
        'attrs': [
            ('id',           'UUID', True,  False),
            ('household_id', 'UUID', False, True),
            ('user_id',      'UUID', False, True),
            ('role',         'ENUM', False, False),
            ('joined_at',    'TIMESTAMPZ', False, False),
        ],
    },
    'households': {
        'color': NAVY,
        'pos': (12.0, 19.0),
        'attrs': [
            ('id',          'UUID',    True,  False),
            ('name',        'VARCHAR', False, False),
            ('invite_code', 'VARCHAR', False, False),
            ('created_by',  'UUID',    False, True),
            ('created_at',  'TIMESTAMPZ', False, False),
        ],
    },
    'subscriptions': {
        'color': GREEN,
        'pos': (17.5, 19.0),
        'attrs': [
            ('id',           'UUID', True,  False),
            ('household_id', 'UUID', False, True),
            ('plan',         'ENUM', False, False),
            ('status',       'ENUM', False, False),
            ('expires_at',   'TIMESTAMPZ', False, False),
        ],
    },
    'notifications': {
        'color': ORANGE,
        'pos': (2.2, 12.5),
        'attrs': [
            ('id',           'UUID',    True,  False),
            ('user_id',      'UUID',    False, True),
            ('household_id', 'UUID',    False, True),
            ('type',         'ENUM',    False, False),
            ('title',        'VARCHAR', False, False),
            ('is_read',      'BOOLEAN', False, False),
        ],
    },
    'wallets': {
        'color': NAVY,
        'pos': (7.2, 12.5),
        'attrs': [
            ('id',              'UUID',    True,  False),
            ('household_id',    'UUID',    False, True),
            ('name',            'VARCHAR', False, False),
            ('type',            'ENUM',    False, False),
            ('current_balance', 'DECIMAL', False, False),
            ('currency',        'CHAR(3)', False, False),
        ],
    },
    'categories': {
        'color': TEAL,
        'pos': (12.0, 12.5),
        'attrs': [
            ('id',           'UUID',    True,  False),
            ('household_id', 'UUID',    False, True),
            ('name',         'VARCHAR', False, False),
            ('type',         'ENUM',    False, False),
            ('icon',         'VARCHAR', False, False),
            ('is_default',   'BOOLEAN', False, False),
        ],
    },
    'budgets': {
        'color': GREEN,
        'pos': (17.0, 12.5),
        'attrs': [
            ('id',           'UUID',    True,  False),
            ('household_id', 'UUID',    False, True),
            ('category_id',  'UUID',    False, True),
            ('amount',       'DECIMAL', False, False),
            ('month',        'SMALLINT',False, False),
            ('year',         'SMALLINT',False, False),
        ],
    },
    'debts': {
        'color': '#8E44AD',
        'pos': (22.0, 12.5),
        'attrs': [
            ('id',               'UUID',    True,  False),
            ('household_id',     'UUID',    False, True),
            ('user_id',          'UUID',    False, True),
            ('type',             'ENUM',    False, False),
            ('total_amount',     'DECIMAL', False, False),
            ('remaining_amount', 'DECIMAL', False, False),
            ('due_date',         'DATE',    False, False),
            ('status',           'ENUM',    False, False),
        ],
    },
    'transactions': {
        'color': NAVY,
        'pos': (7.2, 5.5),
        'attrs': [
            ('id',           'UUID',    True,  False),
            ('household_id', 'UUID',    False, True),
            ('wallet_id',    'UUID',    False, True),
            ('category_id',  'UUID',    False, True),
            ('user_id',      'UUID',    False, True),
            ('recurring_id', 'UUID',    False, True),
            ('type',         'ENUM',    False, False),
            ('amount',       'DECIMAL', False, False),
            ('date',         'DATE',    False, False),
        ],
    },
    'transfers': {
        'color': TEAL,
        'pos': (2.2, 5.5),
        'attrs': [
            ('id',             'UUID',    True,  False),
            ('household_id',   'UUID',    False, True),
            ('from_wallet_id', 'UUID',    False, True),
            ('to_wallet_id',   'UUID',    False, True),
            ('amount',         'DECIMAL', False, False),
            ('date',           'DATE',    False, False),
            ('user_id',        'UUID',    False, True),
        ],
    },
    'recurring_transactions': {
        'color': ORANGE,
        'pos': (13.0, 5.5),
        'attrs': [
            ('id',           'UUID',    True,  False),
            ('household_id', 'UUID',    False, True),
            ('wallet_id',    'UUID',    False, True),
            ('category_id',  'UUID',    False, True),
            ('type',         'ENUM',    False, False),
            ('amount',       'DECIMAL', False, False),
            ('frequency',    'ENUM',    False, False),
            ('is_active',    'BOOLEAN', False, False),
        ],
    },
    'debt_payments': {
        'color': '#8E44AD',
        'pos': (19.0, 5.5),
        'attrs': [
            ('id',         'UUID',    True,  False),
            ('debt_id',    'UUID',    False, True),
            ('wallet_id',  'UUID',    False, True),
            ('amount',     'DECIMAL', False, False),
            ('paid_at',    'DATE',    False, False),
            ('created_by', 'UUID',    False, True),
        ],
    },
    'attachments': {
        'color': GRAY_TEXT,
        'pos': (7.2, -1.0),
        'attrs': [
            ('id',             'UUID',    True,  False),
            ('transaction_id', 'UUID',    False, True),
            ('storage_path',   'TEXT',    False, False),
            ('file_name',      'VARCHAR', False, False),
            ('file_size',      'INTEGER', False, False),
            ('mime_type',      'VARCHAR', False, False),
        ],
    },
}

# ═══════════════════════════════════════════════════════════════════
#  RELATIONSHIPS   (from, to, from_card, to_card)
#  card: '1' or 'N'
# ═══════════════════════════════════════════════════════════════════
RELS = [
    # Household core
    ('users',              'household_members', '1', 'N'),
    ('households',         'household_members', '1', 'N'),
    ('households',         'subscriptions',     '1', 'N'),
    ('households',         'wallets',           '1', 'N'),
    ('households',         'categories',        '1', 'N'),
    ('households',         'budgets',           '1', 'N'),
    ('households',         'debts',             '1', 'N'),
    ('households',         'notifications',     '1', 'N'),
    ('users',              'notifications',     '1', 'N'),
    # Budget ↔ Category
    ('categories',         'budgets',           '1', 'N'),
    # Transactions
    ('wallets',            'transactions',      '1', 'N'),
    ('categories',         'transactions',      '1', 'N'),
    ('recurring_transactions', 'transactions',  '1', 'N'),
    # Transfers
    ('wallets',            'transfers',         '1', 'N'),
    # Recurring
    ('wallets',            'recurring_transactions', '1', 'N'),
    ('categories',         'recurring_transactions', '1', 'N'),
    # Attachments
    ('transactions',       'attachments',       '1', 'N'),
    # Debt payments
    ('debts',              'debt_payments',     '1', 'N'),
    ('wallets',            'debt_payments',     '1', 'N'),
]

# ═══════════════════════════════════════════════════════════════════
#  DRAW HELPERS
# ═══════════════════════════════════════════════════════════════════

def entity_bounds(name):
    e   = ENTITIES[name]
    cx, yt = e['pos']
    n_attrs = len(e['attrs'])
    h   = HDR_H + n_attrs * ROW_H
    xl  = cx - BOX_W/2
    return {'xl': xl, 'xr': xl+BOX_W, 'yt': yt, 'yb': yt-h,
            'cx': cx, 'cy': yt - h/2}

def draw_entity(ax, name):
    e      = ENTITIES[name]
    col    = e['color']
    cx, yt = e['pos']
    attrs  = e['attrs']
    n      = len(attrs)
    h      = HDR_H + n * ROW_H
    xl     = cx - BOX_W/2

    # Drop shadow
    ax.add_patch(FancyBboxPatch(
        (xl+0.07, yt-h-0.07), BOX_W, h,
        boxstyle='round,pad=0.06', linewidth=0,
        facecolor='#CCCCCC', zorder=1))

    # Header
    ax.add_patch(FancyBboxPatch(
        (xl, yt-HDR_H), BOX_W, HDR_H,
        boxstyle='square,pad=0', linewidth=1.5,
        edgecolor=col, facecolor=col, zorder=2))

    # Body
    ax.add_patch(FancyBboxPatch(
        (xl, yt-h), BOX_W, h-HDR_H,
        boxstyle='square,pad=0', linewidth=1.5,
        edgecolor=col, facecolor=WHITE, zorder=2))

    # Entity name
    display = name.replace('_', '\n') if len(name) > 14 else name
    ax.text(cx, yt - HDR_H/2, display,
            ha='center', va='center', fontsize=8.5, fontweight='bold',
            color=WHITE, zorder=3, fontfamily='monospace',
            linespacing=1.2)

    # Divider
    ax.plot([xl, xl+BOX_W], [yt-HDR_H, yt-HDR_H],
            color=col, linewidth=1.5, zorder=3)

    # Attributes
    for i, (aname, atype, pk, fk) in enumerate(attrs):
        ya = yt - HDR_H - (i + 0.5) * ROW_H
        # Alternating row tint
        if i % 2 == 0:
            ax.add_patch(FancyBboxPatch(
                (xl, yt-HDR_H-(i+1)*ROW_H), BOX_W, ROW_H,
                boxstyle='square,pad=0', linewidth=0,
                facecolor='#F7F9FA', zorder=2))
        prefix = ''
        tcol   = ATTR_COL
        tbold  = False
        if pk:
            prefix = 'PK '; tcol = PK_COL; tbold = True
        elif fk:
            prefix = 'FK '; tcol = FK_COL

        ax.text(xl+0.18, ya, prefix + aname,
                ha='left', va='center', fontsize=7,
                color=tcol, fontweight='bold' if tbold else 'normal',
                zorder=3, fontfamily='monospace')
        ax.text(xl+BOX_W-0.12, ya, atype,
                ha='right', va='center', fontsize=6.5,
                color=GRAY_TEXT, style='italic', zorder=3)

    # Bottom border line
    ax.plot([xl, xl+BOX_W], [yt-h, yt-h],
            color=col, linewidth=1.2, zorder=3)

def midpoint(p1, p2):
    return ((p1[0]+p2[0])/2, (p1[1]+p2[1])/2)

def closest_edges(b1, b2):
    """Return the (pt_on_b1, pt_on_b2) pair with shortest distance."""
    sides1 = {
        'L': (b1['xl'],       b1['cy']),
        'R': (b1['xr'],       b1['cy']),
        'T': (b1['cx'],       b1['yt']),
        'B': (b1['cx'],       b1['yb']),
    }
    sides2 = {
        'L': (b2['xl'],       b2['cy']),
        'R': (b2['xr'],       b2['cy']),
        'T': (b2['cx'],       b2['yt']),
        'B': (b2['cx'],       b2['yb']),
    }
    best_d = 1e9; best_p1 = None; best_p2 = None
    for _, p1 in sides1.items():
        for _, p2 in sides2.items():
            d = (p1[0]-p2[0])**2 + (p1[1]-p2[1])**2
            if d < best_d:
                best_d = d; best_p1 = p1; best_p2 = p2
    return best_p1, best_p2

def draw_relationship(ax, from_name, to_name, from_card, to_card):
    b1 = entity_bounds(from_name)
    b2 = entity_bounds(to_name)
    p1, p2 = closest_edges(b1, b2)

    ax.annotate('', xy=p2, xytext=p1,
                arrowprops=dict(
                    arrowstyle='-',
                    color=BORDER,
                    lw=1.4,
                    connectionstyle='arc3,rad=0.0'),
                zorder=0)

    # Cardinality labels
    mx, my = midpoint(p1, p2)
    offset = 0.22
    dx = p2[0] - p1[0]; dy = p2[1] - p1[1]
    length = max((dx**2+dy**2)**0.5, 0.01)
    nx = -dy/length * offset; ny = dx/length * offset

    # from_card near p1
    fp = (p1[0] + (p2[0]-p1[0])*0.12, p1[1] + (p2[1]-p1[1])*0.12)
    ax.text(fp[0]+nx, fp[1]+ny, from_card,
            ha='center', va='center', fontsize=8, fontweight='bold',
            color=NAVY, zorder=4,
            bbox=dict(boxstyle='round,pad=0.1', facecolor=WHITE, edgecolor='none', alpha=0.8))
    # to_card near p2
    tp = (p1[0] + (p2[0]-p1[0])*0.88, p1[1] + (p2[1]-p1[1])*0.88)
    ax.text(tp[0]+nx, tp[1]+ny, to_card,
            ha='center', va='center', fontsize=8, fontweight='bold',
            color=NAVY, zorder=4,
            bbox=dict(boxstyle='round,pad=0.1', facecolor=WHITE, edgecolor='none', alpha=0.8))

# ═══════════════════════════════════════════════════════════════════
#  DRAW THE DIAGRAM
# ═══════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(26, 22))
ax.set_xlim(-0.3, 26)
ax.set_ylim(-3.5, 20.5)
ax.set_facecolor('#F8FAFB')
fig.patch.set_facecolor('#F8FAFB')
ax.axis('off')

# Title
ax.text(13, 20.1, 'Maalify — Entity Relationship Diagram (ERD)',
        ha='center', va='center', fontsize=16, fontweight='bold',
        color=NAVY, fontfamily='sans-serif')
ax.text(13, 19.7, 'v1.0  |  Database: PostgreSQL (Supabase)  |  15 Mei 2026',
        ha='center', va='center', fontsize=9, color=GRAY_TEXT)

# Relationships first (behind boxes)
for (fn, tn, fc, tc) in RELS:
    draw_relationship(ax, fn, tn, fc, tc)

# Entities on top
for name in ENTITIES:
    draw_entity(ax, name)

# Legend
leg_x, leg_y = 22.0, 2.8
ax.add_patch(FancyBboxPatch((leg_x-0.2, leg_y-2.2), 3.8, 2.6,
             boxstyle='round,pad=0.1', linewidth=1,
             edgecolor=BORDER, facecolor=WHITE, zorder=5))
ax.text(leg_x+1.7, leg_y+0.2, 'Legend', ha='center', fontsize=9,
        fontweight='bold', color=NAVY, zorder=6)
legend_items = [
    (PK_COL, 'PK  Primary Key'),
    (FK_COL, 'FK  Foreign Key'),
    (BORDER, '——  Relationship'),
]
for i, (c, lbl) in enumerate(legend_items):
    ly = leg_y - 0.5 - i*0.6
    ax.plot([leg_x, leg_x+0.5], [ly, ly], color=c, lw=3, zorder=6)
    ax.text(leg_x+0.65, ly, lbl, va='center', fontsize=8,
            color=ATTR_COL, zorder=6)

# Group labels (background zones)
zones = [
    ((-0.1, 14.8, 25.8, 5.0),  '#EBF5FB', 'Auth & Household'),
    ((-0.1,  8.8, 25.8, 4.5),  '#EAFAF1', 'Financial Core'),
    ((-0.1,  2.2, 25.8, 4.5),  '#FEF9E7', 'Transactions'),
    ((-0.1, -3.2, 25.8, 2.8),  '#FDEDEC', 'Attachments'),
]
for (x, y, w, h), fc, lbl in zones:
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                 boxstyle='round,pad=0.1', linewidth=0.5,
                 edgecolor=BORDER, facecolor=fc, alpha=0.4, zorder=0))
    ax.text(x+0.3, y+h-0.3, lbl,
            ha='left', va='top', fontsize=8, color=GRAY_TEXT,
            style='italic', zorder=1)

plt.tight_layout(pad=0.5)
out_img = '/sessions/hopeful-exciting-feynman/mnt/outputs/maalify_erd_diagram.png'
plt.savefig(out_img, dpi=180, bbox_inches='tight',
            facecolor=fig.get_facecolor())
plt.close()
print('Diagram saved:', out_img)


# ═══════════════════════════════════════════════════════════════════
#  DOCX  DOCUMENT
# ═══════════════════════════════════════════════════════════════════

from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
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

style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10.5)

C_NAVY  = RGBColor(0x1E, 0x3A, 0x5F)
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
C_GRAY  = RGBColor(0x7F, 0x8C, 0x8D)
C_PK    = RGBColor(0xC0, 0x39, 0x2B)
C_FK    = RGBColor(0x24, 0x71, 0xA3)

HDR_HEX = '1E3A5F'
ALT_HEX = 'F4F6F8'
WHT_HEX = 'FFFFFF'
BRD_HEX = 'BDC3C7'

def set_cell_bg(cell, hexc):
    tc = cell._tc; tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hexc); tcPr.append(shd)

def set_cell_borders(cell, color=BRD_HEX):
    tc = cell._tc; tcPr = tc.get_or_add_tcPr()
    tcB = OxmlElement('w:tcBorders')
    for side in ('top','left','bottom','right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'), 'single'); el.set(qn('w:sz'), '4')
        el.set(qn('w:space'), '0'); el.set(qn('w:color'), color)
        tcB.append(el)
    tcPr.append(tcB)

def h1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after  = Pt(6)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'), 'single'); bot.set(qn('w:sz'), '6')
    bot.set(qn('w:space'), '1'); bot.set(qn('w:color'), HDR_HEX)
    pBdr.append(bot); pPr.append(pBdr)
    r = p.add_run(text)
    r.font.name = 'Calibri'; r.font.size = Pt(16)
    r.font.bold = True; r.font.color.rgb = C_NAVY
    return p

def h2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after  = Pt(4)
    r = p.add_run(text)
    r.font.name = 'Calibri'; r.font.size = Pt(12)
    r.font.bold = True; r.font.color.rgb = C_NAVY
    return p

def body(text, after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text)
    r.font.name = 'Calibri'; r.font.size = Pt(10.5)
    return p

def info_box(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent  = Cm(0.5)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(6)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    for side in ('top','left','bottom','right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), '8' if side=='left' else '4')
        el.set(qn('w:space'), '4'); el.set(qn('w:color'), '2471A3')
        pBdr.append(el)
    pPr.append(pBdr)
    r = p.add_run(text)
    r.font.name = 'Calibri'; r.font.size = Pt(10); r.font.italic = True

# ── COVER ─────────────────────────────────────────────────────────

for _ in range(4): doc.add_paragraph()
tp = doc.add_paragraph()
tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr = tp.add_run('ENTITY RELATIONSHIP DOCUMENT')
tr.font.name='Calibri'; tr.font.size=Pt(26); tr.font.bold=True; tr.font.color.rgb=C_NAVY

doc.add_paragraph()
sp = doc.add_paragraph()
sp.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr = sp.add_run('Maalify')
sr.font.name='Calibri'; sr.font.size=Pt(20); sr.font.bold=True
sr.font.color.rgb = RGBColor(0x27,0xAE,0x60)

sp2 = doc.add_paragraph()
sp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr2 = sp2.add_run('Platform Pencatatan Keuangan Keluarga (SaaS)')
sr2.font.name='Calibri'; sr2.font.size=Pt(13)
sr2.font.color.rgb = RGBColor(0x55,0x55,0x55)

for _ in range(2): doc.add_paragraph()

meta_t = doc.add_table(rows=5, cols=2)
meta_t.alignment = WD_TABLE_ALIGNMENT.CENTER
for row in meta_t.rows:
    for cell in row.cells:
        tc = cell._tc; tcPr = tc.get_or_add_tcPr()
        tcB = OxmlElement('w:tcBorders')
        for side in ('top','left','bottom','right'):
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:val'),'nil'); tcB.append(el)
        tcPr.append(tcB)

meta_vals = [
    ('Versi','v1.0.0'), ('Tanggal','15 Mei 2026'), ('Status','Draft'),
    ('Database','PostgreSQL via Supabase'), ('Total Entiti','14 Tabel'),
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

# ── 1. OVERVIEW ────────────────────────────────────────────────────

h1('1. Overview')
body(
    'Dokumen ini mendefinisikan skema database Maalify — platform SaaS pencatatan '
    'keuangan keluarga. ERD dirancang menggunakan PostgreSQL (Supabase) dengan '
    'Row Level Security (RLS) untuk isolasi data antar Household.'
)
info_box(
    'Semua tabel menggunakan UUID sebagai Primary Key. '
    'Kolom created_at / updated_at bertipe TIMESTAMPTZ (UTC). '
    'RLS Policy diterapkan pada setiap tabel berdasarkan household_id.'
)

doc.add_paragraph()

# ── 2. ERD DIAGRAM ─────────────────────────────────────────────────

h1('2. ERD Diagram')
body('Diagram berikut menampilkan keseluruhan entiti dan relasinya:')
doc.add_paragraph()

p_img = doc.add_paragraph()
p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_img = p_img.add_run()
run_img.add_picture(out_img, width=Cm(16))

cap = doc.add_paragraph()
cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
cr = cap.add_run('Gambar 1 — Maalify ERD v1.0 (14 Entiti, PostgreSQL)')
cr.font.name='Calibri'; cr.font.size=Pt(9); cr.font.italic=True
cr.font.color.rgb = C_GRAY

doc.add_page_break()

# ── 3. ENTITY CATALOGUE ────────────────────────────────────────────

h1('3. Entity Catalogue')
body('Berikut adalah deskripsi lengkap setiap entiti beserta atribut, tipe data, dan constraint.')

# Group definitions
GROUPS = [
    ('Auth & Household', ['users','household_members','households','subscriptions','notifications']),
    ('Financial Core',   ['wallets','categories','budgets','debts']),
    ('Transactions',     ['transactions','transfers','recurring_transactions','debt_payments','attachments']),
]

ENTITY_DESC = {
    'users':                 'Merepresentasikan setiap pengguna yang terdaftar di platform Maalify. Dikelola oleh Supabase Auth; tabel ini menyimpan data profil tambahan.',
    'household_members':     'Junction table yang menghubungkan User dengan Household. Menyimpan role pengguna (admin/member) dalam sebuah keluarga.',
    'households':            'Unit keluarga dalam sistem. Satu Household adalah satu keluarga yang berbagi data keuangan bersama. Semua data keuangan terikat pada Household.',
    'subscriptions':         'Menyimpan data langganan (plan) setiap Household. Mendukung model Freemium (free) dan berbayar (basic, premium).',
    'notifications':         'Menyimpan notifikasi sistem untuk pengguna: peringatan budget, reminder hutang jatuh tempo, dan notifikasi sistem lainnya.',
    'wallets':               'Dompet virtual milik Household (contoh: Rekening BCA, Dompet Tunai, Tabungan). Setiap Household dapat memiliki banyak Wallet.',
    'categories':            'Kategori transaksi (income/expense). Sistem menyediakan kategori default; Admin dapat menambah kategori kustom per Household.',
    'budgets':               'Batas anggaran per kategori pengeluaran per bulan. Digunakan untuk fitur budget monitoring dan notifikasi.',
    'debts':                 'Mencatat hutang (payable) dan piutang (receivable) Household. Menyimpan total dan sisa hutang yang belum dilunasi.',
    'transactions':          'Tabel utama pencatatan keuangan. Setiap pemasukan dan pengeluaran tersimpan di sini beserta referensi ke wallet, kategori, dan pengguna.',
    'transfers':             'Mencatat perpindahan dana antar Wallet dalam satu Household. Transfer tidak mengubah total aset, hanya memindahkan saldo.',
    'recurring_transactions':'Template untuk transaksi berulang otomatis (gaji bulanan, tagihan rutin). Sistem akan generate transaksi berdasarkan frekuensi yang ditentukan.',
    'debt_payments':         'Mencatat setiap pembayaran cicilan untuk sebuah hutang/piutang. Setiap pembayaran mengurangi remaining_amount pada tabel debts.',
    'attachments':           'Menyimpan metadata file lampiran (foto struk/nota) yang diunggah ke Supabase Storage untuk sebuah transaksi.',
}

# Full attribute definitions
ENTITY_ATTRS_FULL = {
    'users': [
        ('id',          'UUID',         'PRIMARY KEY',          'Identiti unik pengguna (generated by Supabase Auth)'),
        ('email',       'VARCHAR(255)', 'UNIQUE NOT NULL',      'Alamat email pengguna, unik di seluruh sistem'),
        ('name',        'VARCHAR(100)', 'NOT NULL',             'Nama lengkap pengguna'),
        ('avatar_url',  'TEXT',         'NULLABLE',             'URL foto profil (Supabase Storage)'),
        ('created_at',  'TIMESTAMPTZ',  'DEFAULT NOW()',        'Waktu registrasi akun'),
        ('updated_at',  'TIMESTAMPTZ',  'DEFAULT NOW()',        'Waktu update terakhir profil'),
    ],
    'household_members': [
        ('id',           'UUID',       'PRIMARY KEY',           'Identiti unik record'),
        ('household_id', 'UUID',       'FK → households.id',   'Referensi ke Household'),
        ('user_id',      'UUID',       'FK → users.id',        'Referensi ke User'),
        ('role',         'ENUM',       'NOT NULL',              "Role dalam keluarga: 'admin' | 'member'"),
        ('joined_at',    'TIMESTAMPTZ','DEFAULT NOW()',         'Waktu bergabung ke Household'),
    ],
    'households': [
        ('id',          'UUID',        'PRIMARY KEY',           'Identiti unik Household'),
        ('name',        'VARCHAR(100)','NOT NULL',              'Nama keluarga (contoh: "Keluarga Budi")'),
        ('description', 'TEXT',        'NULLABLE',              'Deskripsi opsional'),
        ('invite_code', 'VARCHAR(20)', 'UNIQUE NOT NULL',       'Kode unik untuk undang anggota baru'),
        ('created_by',  'UUID',        'FK → users.id',        'User yang membuat Household (Admin pertama)'),
        ('created_at',  'TIMESTAMPTZ', 'DEFAULT NOW()',         'Waktu pembuatan Household'),
    ],
    'subscriptions': [
        ('id',           'UUID',       'PRIMARY KEY',           'Identiti unik langganan'),
        ('household_id', 'UUID',       'FK → households.id',   'Household yang berlangganan'),
        ('plan',         'ENUM',       'NOT NULL',              "Tipe plan: 'free' | 'basic' | 'premium'"),
        ('status',       'ENUM',       'NOT NULL',              "Status: 'active' | 'cancelled' | 'expired'"),
        ('started_at',   'TIMESTAMPTZ','NOT NULL',              'Waktu mulai langganan'),
        ('expires_at',   'TIMESTAMPTZ','NULLABLE',              'Waktu berakhir (NULL untuk free plan)'),
    ],
    'notifications': [
        ('id',           'UUID',       'PRIMARY KEY',           'Identiti unik notifikasi'),
        ('user_id',      'UUID',       'FK → users.id',        'Penerima notifikasi'),
        ('household_id', 'UUID',       'FK → households.id',   'Household terkait'),
        ('type',         'ENUM',       'NOT NULL',              "Jenis: 'budget_warning' | 'debt_due' | 'system'"),
        ('title',        'VARCHAR(150)','NOT NULL',             'Judul notifikasi'),
        ('message',      'TEXT',       'NOT NULL',              'Isi pesan notifikasi'),
        ('is_read',      'BOOLEAN',    'DEFAULT FALSE',         'Status baca notifikasi'),
        ('created_at',   'TIMESTAMPTZ','DEFAULT NOW()',         'Waktu notifikasi dibuat'),
    ],
    'wallets': [
        ('id',              'UUID',    'PRIMARY KEY',           'Identiti unik wallet'),
        ('household_id',    'UUID',    'FK → households.id',   'Wallet milik Household ini'),
        ('name',            'VARCHAR(100)', 'NOT NULL',         'Nama wallet (contoh: "Rekening Utama")'),
        ('type',            'ENUM',    'NOT NULL',              "Jenis: 'cash' | 'bank' | 'savings' | 'ewallet'"),
        ('initial_balance', 'DECIMAL(15,2)','DEFAULT 0',       'Saldo awal saat wallet dibuat'),
        ('current_balance', 'DECIMAL(15,2)','DEFAULT 0',       'Saldo terkini (dihitung otomatis)'),
        ('currency',        'CHAR(3)', "DEFAULT 'IDR'",        'Kode mata uang (ISO 4217)'),
        ('color',           'VARCHAR(7)', 'NULLABLE',           'Warna hex untuk UI (#RRGGBB)'),
        ('is_active',       'BOOLEAN', 'DEFAULT TRUE',          'Soft delete wallet'),
        ('created_by',      'UUID',    'FK → users.id',        'User yang membuat wallet'),
        ('created_at',      'TIMESTAMPTZ','DEFAULT NOW()',      'Waktu pembuatan'),
    ],
    'categories': [
        ('id',           'UUID',       'PRIMARY KEY',           'Identiti unik kategori'),
        ('household_id', 'UUID',       'FK → households.id, NULLABLE', 'NULL untuk kategori default sistem'),
        ('name',         'VARCHAR(80)','NOT NULL',              'Nama kategori (contoh: "Makan & Minum")'),
        ('type',         'ENUM',       'NOT NULL',              "Jenis: 'income' | 'expense'"),
        ('icon',         'VARCHAR(50)','NULLABLE',              'Nama icon (emoji atau icon library key)'),
        ('color',        'VARCHAR(7)', 'NULLABLE',              'Warna hex untuk UI'),
        ('is_default',   'BOOLEAN',    'DEFAULT FALSE',         'TRUE = kategori bawaan sistem, tidak bisa dihapus'),
        ('created_at',   'TIMESTAMPTZ','DEFAULT NOW()',         'Waktu pembuatan'),
    ],
    'budgets': [
        ('id',           'UUID',       'PRIMARY KEY',           'Identiti unik budget'),
        ('household_id', 'UUID',       'FK → households.id',   'Budget milik Household ini'),
        ('category_id',  'UUID',       'FK → categories.id',   'Kategori yang dianggarkan'),
        ('amount',       'DECIMAL(15,2)','NOT NULL',            'Jumlah anggaran'),
        ('period',       'ENUM',       "DEFAULT 'monthly'",    "Periode: 'monthly' | 'yearly'"),
        ('month',        'SMALLINT',   'NOT NULL',              'Bulan (1-12)'),
        ('year',         'SMALLINT',   'NOT NULL',              'Tahun (contoh: 2026)'),
        ('created_at',   'TIMESTAMPTZ','DEFAULT NOW()',         'Waktu pembuatan'),
    ],
    'debts': [
        ('id',               'UUID',   'PRIMARY KEY',           'Identiti unik hutang/piutang'),
        ('household_id',     'UUID',   'FK → households.id',   'Hutang milik Household ini'),
        ('user_id',          'UUID',   'FK → users.id',        'Anggota yang mencatat hutang ini'),
        ('type',             'ENUM',   'NOT NULL',              "Jenis: 'payable' (hutang) | 'receivable' (piutang)"),
        ('party_name',       'VARCHAR(100)','NOT NULL',         'Nama pihak lain (pemberi/penerima hutang)'),
        ('total_amount',     'DECIMAL(15,2)','NOT NULL',        'Jumlah total hutang/piutang'),
        ('remaining_amount', 'DECIMAL(15,2)','NOT NULL',        'Sisa yang belum dibayar'),
        ('due_date',         'DATE',   'NULLABLE',              'Tanggal jatuh tempo'),
        ('description',      'TEXT',   'NULLABLE',              'Keterangan tambahan'),
        ('status',           'ENUM',   'NOT NULL',              "Status: 'active' | 'settled' | 'overdue'"),
        ('created_at',       'TIMESTAMPTZ','DEFAULT NOW()',     'Waktu pencatatan'),
    ],
    'transactions': [
        ('id',           'UUID',       'PRIMARY KEY',           'Identiti unik transaksi'),
        ('household_id', 'UUID',       'FK → households.id',   'Transaksi milik Household ini'),
        ('wallet_id',    'UUID',       'FK → wallets.id',      'Wallet sumber/tujuan transaksi'),
        ('category_id',  'UUID',       'FK → categories.id',   'Kategori transaksi'),
        ('user_id',      'UUID',       'FK → users.id',        'Anggota yang mencatat transaksi'),
        ('recurring_id', 'UUID',       'FK → recurring_transactions.id, NULLABLE', 'Referensi jika dari transaksi berulang'),
        ('type',         'ENUM',       'NOT NULL',              "Jenis: 'income' | 'expense'"),
        ('amount',       'DECIMAL(15,2)','NOT NULL',            'Jumlah transaksi (selalu positif)'),
        ('description',  'VARCHAR(200)','NOT NULL',             'Deskripsi singkat transaksi'),
        ('date',         'DATE',       'NOT NULL',              'Tanggal transaksi'),
        ('note',         'TEXT',       'NULLABLE',              'Catatan opsional tambahan'),
        ('created_at',   'TIMESTAMPTZ','DEFAULT NOW()',         'Waktu pencatatan'),
        ('updated_at',   'TIMESTAMPTZ','DEFAULT NOW()',         'Waktu update terakhir'),
    ],
    'transfers': [
        ('id',             'UUID',     'PRIMARY KEY',           'Identiti unik transfer'),
        ('household_id',   'UUID',     'FK → households.id',   'Transfer dalam Household ini'),
        ('from_wallet_id', 'UUID',     'FK → wallets.id',      'Wallet sumber'),
        ('to_wallet_id',   'UUID',     'FK → wallets.id',      'Wallet tujuan'),
        ('amount',         'DECIMAL(15,2)','NOT NULL',          'Jumlah yang ditransfer'),
        ('description',    'VARCHAR(200)','NULLABLE',           'Keterangan transfer'),
        ('date',           'DATE',     'NOT NULL',              'Tanggal transfer'),
        ('user_id',        'UUID',     'FK → users.id',        'Anggota yang melakukan transfer'),
        ('created_at',     'TIMESTAMPTZ','DEFAULT NOW()',       'Waktu pencatatan'),
    ],
    'recurring_transactions': [
        ('id',              'UUID',    'PRIMARY KEY',           'Identiti unik transaksi berulang'),
        ('household_id',    'UUID',    'FK → households.id',   'Milik Household ini'),
        ('wallet_id',       'UUID',    'FK → wallets.id',      'Wallet yang digunakan'),
        ('category_id',     'UUID',    'FK → categories.id',   'Kategori transaksi'),
        ('type',            'ENUM',    'NOT NULL',              "Jenis: 'income' | 'expense'"),
        ('amount',          'DECIMAL(15,2)','NOT NULL',         'Jumlah yang dicatat setiap periode'),
        ('description',     'VARCHAR(200)','NOT NULL',          'Nama/deskripsi transaksi berulang'),
        ('frequency',       'ENUM',    'NOT NULL',              "Frekuensi: 'daily' | 'weekly' | 'monthly'"),
        ('start_date',      'DATE',    'NOT NULL',              'Tanggal mulai'),
        ('end_date',        'DATE',    'NULLABLE',              'Tanggal berakhir (NULL = tidak terbatas)'),
        ('last_generated',  'DATE',    'NULLABLE',              'Tanggal terakhir transaksi di-generate'),
        ('is_active',       'BOOLEAN', 'DEFAULT TRUE',          'Status aktif/nonaktif'),
        ('created_by',      'UUID',    'FK → users.id',        'Anggota yang membuat template ini'),
        ('created_at',      'TIMESTAMPTZ','DEFAULT NOW()',      'Waktu pembuatan'),
    ],
    'debt_payments': [
        ('id',         'UUID',         'PRIMARY KEY',           'Identiti unik pembayaran'),
        ('debt_id',    'UUID',         'FK → debts.id',        'Referensi hutang yang dibayar'),
        ('wallet_id',  'UUID',         'FK → wallets.id',      'Wallet sumber pembayaran'),
        ('amount',     'DECIMAL(15,2)','NOT NULL',              'Jumlah yang dibayarkan'),
        ('paid_at',    'DATE',         'NOT NULL',              'Tanggal pembayaran'),
        ('note',       'TEXT',         'NULLABLE',              'Catatan opsional'),
        ('created_by', 'UUID',         'FK → users.id',        'Anggota yang mencatat pembayaran'),
        ('created_at', 'TIMESTAMPTZ',  'DEFAULT NOW()',         'Waktu pencatatan'),
    ],
    'attachments': [
        ('id',             'UUID',     'PRIMARY KEY',           'Identiti unik attachment'),
        ('transaction_id', 'UUID',     'FK → transactions.id', 'Transaksi yang dilampiri'),
        ('storage_path',   'TEXT',     'NOT NULL',              'Path file di Supabase Storage'),
        ('file_name',      'VARCHAR(255)','NOT NULL',           'Nama file asli'),
        ('file_size',      'INTEGER',  'NOT NULL',              'Ukuran file dalam bytes'),
        ('mime_type',      'VARCHAR(100)','NOT NULL',           'Tipe MIME (contoh: image/jpeg)'),
        ('created_at',     'TIMESTAMPTZ','DEFAULT NOW()',       'Waktu upload'),
    ],
}

for group_name, entity_list in GROUPS:
    h1(f'3.x  {group_name}')
    for ent_name in entity_list:
        h2(f'Tabel: {ent_name}')
        body(ENTITY_DESC.get(ent_name, ''))

        attrs_full = ENTITY_ATTRS_FULL.get(ent_name, [])
        col_w = [Cm(3.5), Cm(3.5), Cm(3.5), Cm(6.1)]
        tbl = doc.add_table(rows=1+len(attrs_full), cols=4)
        tbl.alignment = WD_TABLE_ALIGNMENT.LEFT

        # Header
        hrow = tbl.rows[0]
        for i, htxt in enumerate(['Kolom', 'Tipe Data', 'Constraint', 'Keterangan']):
            c = hrow.cells[i]; c.width = col_w[i]
            set_cell_bg(c, HDR_HEX); set_cell_borders(c)
            p_el = c.paragraphs[0]
            r = p_el.add_run(htxt)
            r.font.name='Calibri'; r.font.size=Pt(10)
            r.font.bold=True; r.font.color.rgb=C_WHITE

        # Rows
        for ri, (col, dtype, constraint, desc) in enumerate(attrs_full):
            row = tbl.rows[ri+1]
            is_pk = 'PRIMARY KEY' in constraint
            is_fk = 'FK' in constraint
            bg = ALT_HEX if ri % 2 == 0 else WHT_HEX
            for ci, (val, w) in enumerate(zip([col, dtype, constraint, desc], col_w)):
                c = row.cells[ci]; c.width = w
                set_cell_bg(c, bg); set_cell_borders(c, BRD_HEX)
                p_el = c.paragraphs[0]
                r = p_el.add_run(val)
                r.font.name='Calibri'; r.font.size=Pt(9.5)
                if ci == 0 and is_pk:
                    r.font.bold=True; r.font.color.rgb=C_PK
                elif ci == 0 and is_fk:
                    r.font.bold=True; r.font.color.rgb=C_FK
                elif ci == 2:
                    r.font.color.rgb = RGBColor(0x44,0x44,0x44)

        doc.add_paragraph()

doc.add_page_break()

# ── 4. RELATIONSHIP TABLE ──────────────────────────────────────────

h1('4. Relationship Summary')
body('Tabel berikut merangkum semua relasi antar entiti beserta jenis dan keterangan:')

rel_data = [
    ('users',              'household_members', '1 → N', 'Satu user bisa menjadi anggota banyak Household'),
    ('households',         'household_members', '1 → N', 'Satu Household memiliki banyak anggota'),
    ('households',         'subscriptions',     '1 → N', 'Satu Household punya satu atau lebih riwayat langganan'),
    ('households',         'wallets',           '1 → N', 'Satu Household bisa punya banyak Wallet'),
    ('households',         'categories',        '1 → N', 'Satu Household bisa punya banyak Kategori kustom'),
    ('households',         'budgets',           '1 → N', 'Satu Household punya banyak Budget per bulan'),
    ('households',         'debts',             '1 → N', 'Satu Household punya banyak catatan hutang/piutang'),
    ('households',         'notifications',     '1 → N', 'Satu Household memiliki banyak notifikasi'),
    ('users',              'notifications',     '1 → N', 'Satu user menerima banyak notifikasi'),
    ('categories',         'budgets',           '1 → N', 'Satu kategori bisa punya budget di banyak bulan'),
    ('wallets',            'transactions',      '1 → N', 'Satu Wallet punya banyak transaksi'),
    ('categories',         'transactions',      '1 → N', 'Satu kategori mencakup banyak transaksi'),
    ('recurring_transactions','transactions',   '1 → N', 'Satu template menghasilkan banyak transaksi'),
    ('wallets',            'transfers',         '1 → N', 'Satu Wallet bisa jadi sumber/tujuan banyak transfer'),
    ('wallets',            'recurring_transactions','1 → N','Satu Wallet digunakan banyak template berulang'),
    ('categories',         'recurring_transactions','1 → N','Satu kategori digunakan banyak template berulang'),
    ('transactions',       'attachments',       '1 → N', 'Satu transaksi bisa punya banyak lampiran'),
    ('debts',              'debt_payments',     '1 → N', 'Satu hutang punya banyak riwayat pembayaran'),
    ('wallets',            'debt_payments',     '1 → N', 'Satu Wallet digunakan untuk banyak pembayaran hutang'),
]

rel_col_w = [Cm(3.8), Cm(3.8), Cm(2.0), Cm(7.0)]
rel_tbl = doc.add_table(rows=1+len(rel_data), cols=4)
rel_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = rel_tbl.rows[0]
for i, htxt in enumerate(['Dari', 'Ke', 'Kardinalitas', 'Keterangan']):
    c = hrow.cells[i]; c.width = rel_col_w[i]
    set_cell_bg(c, HDR_HEX); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name='Calibri'; r.font.size=Pt(10.5)
    r.font.bold=True; r.font.color.rgb=C_WHITE

for ri, (frm, to, card, note) in enumerate(rel_data):
    row = rel_tbl.rows[ri+1]
    bg = ALT_HEX if ri % 2 == 0 else WHT_HEX
    for ci, (val, w) in enumerate(zip([frm, to, card, note], rel_col_w)):
        c = row.cells[ci]; c.width = w
        set_cell_bg(c, bg); set_cell_borders(c, BRD_HEX)
        p_el = c.paragraphs[0]
        if ci == 2: p_el.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p_el.add_run(val)
        r.font.name='Calibri'; r.font.size=Pt(10)
        if ci < 2: r.font.bold=True; r.font.color.rgb=C_NAVY if ci < 2 else ATTR_COL

doc.add_paragraph()

# ── 5. RLS POLICY NOTES ────────────────────────────────────────────

h1('5. Row Level Security (RLS) Policy')
info_box(
    'RLS adalah fitur PostgreSQL yang memastikan setiap pengguna hanya bisa '
    'mengakses data Household-nya sendiri — tanpa perlu filter manual di setiap query.'
)
body('Berikut adalah pendekatan RLS yang diterapkan pada Maalify:')

rls_items = [
    'Semua tabel yang memiliki household_id dilindungi dengan RLS policy: '
    'SELECT/INSERT/UPDATE/DELETE hanya diizinkan jika auth.uid() adalah anggota Household tersebut.',

    'Tabel users hanya bisa di-read oleh user sendiri dan sesama anggota Household yang sama.',

    'Tabel categories mengizinkan read untuk semua anggota Household, '
    'tetapi INSERT/UPDATE/DELETE hanya untuk Admin.',

    'Tabel household_members: Admin dapat mengelola anggota; '
    'Member hanya bisa read.',

    'Tabel notifications: Setiap user hanya bisa read notifikasi miliknya sendiri.',

    'Supabase Auth JWT token digunakan untuk mendapatkan auth.uid() '
    'secara otomatis di setiap request.',
]
for item in rls_items:
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(item)
    r.font.name='Calibri'; r.font.size=Pt(10.5)

doc.add_paragraph()

# ── 6. INDEX RECOMMENDATIONS ───────────────────────────────────────

h1('6. Index Recommendations')
body('Index berikut direkomendasikan untuk memastikan performa query yang optimal:')

idx_data = [
    ('transactions', 'household_id, date DESC',     'Filter transaksi per Household dan urut tanggal'),
    ('transactions', 'wallet_id',                    'Filter transaksi per Wallet'),
    ('transactions', 'category_id',                  'Filter transaksi per kategori'),
    ('budgets',      'household_id, year, month',    'Lookup budget per Household per bulan'),
    ('debts',        'household_id, status',          'Filter hutang aktif per Household'),
    ('notifications','user_id, is_read',              'Notifikasi belum dibaca per user'),
    ('wallets',      'household_id',                  'List wallet per Household'),
]

idx_col_w = [Cm(3.5), Cm(5.5), Cm(7.6)]
idx_tbl = doc.add_table(rows=1+len(idx_data), cols=3)
idx_tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
hrow = idx_tbl.rows[0]
for i, htxt in enumerate(['Tabel', 'Kolom (Index)', 'Alasan']):
    c = hrow.cells[i]; c.width = idx_col_w[i]
    set_cell_bg(c, HDR_HEX); set_cell_borders(c)
    p_el = c.paragraphs[0]
    r = p_el.add_run(htxt)
    r.font.name='Calibri'; r.font.size=Pt(10.5)
    r.font.bold=True; r.font.color.rgb=C_WHITE

for ri, (tname, cols, reason) in enumerate(idx_data):
    row = idx_tbl.rows[ri+1]
    bg = ALT_HEX if ri % 2 == 0 else WHT_HEX
    for ci, (val, w) in enumerate(zip([tname, cols, reason], idx_col_w)):
        c = row.cells[ci]; c.width = w
        set_cell_bg(c, bg); set_cell_borders(c, BRD_HEX)
        p_el = c.paragraphs[0]
        r = p_el.add_run(val)
        r.font.name='Calibri'; r.font.size=Pt(10)
        if ci == 1:
            r.font.name='Courier New'; r.font.color.rgb=C_FK

doc.add_paragraph()

# ── Sign-off ──────────────────────────────────────────────────────

doc.add_page_break()
for _ in range(8): doc.add_paragraph()
ep = doc.add_paragraph(); ep.alignment = WD_ALIGN_PARAGRAPH.CENTER
er = ep.add_run('— Document End —')
er.font.name='Calibri'; er.font.size=Pt(10); er.font.italic=True; er.font.color.rgb=C_GRAY
vp = doc.add_paragraph(); vp.alignment = WD_ALIGN_PARAGRAPH.CENTER
vr = vp.add_run('Maalify ERD v1.0.0  |  15 Mei 2026  |  Confidential')
vr.font.name='Calibri'; vr.font.size=Pt(9); vr.font.color.rgb=C_GRAY

# ── SAVE ──────────────────────────────────────────────────────────

out_doc = '/sessions/hopeful-exciting-feynman/mnt/outputs/Maalify_ERD_v1.0.docx'
doc.save(out_doc)
print('Document saved:', out_doc)
