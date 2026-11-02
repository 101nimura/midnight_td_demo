# -*- coding: utf-8 -*-
"""docs/SETUP.md の内容をスライド化して docs/SETUP.pptx を生成する（python-pptx）"""
from pathlib import Path
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "docs" / "images"
OUT = ROOT / "docs" / "SETUP.pptx"

JP = "Yu Gothic UI"
MONO = "Consolas"
NAVY = RGBColor(0x0B, 0x10, 0x20)
NAVY2 = RGBColor(0x14, 0x1B, 0x2F)
BLUE = RGBColor(0x4F, 0x7C, 0xFF)
TEXT = RGBColor(0x1F, 0x24, 0x33)
MUTED = RGBColor(0x6B, 0x74, 0x8A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = RGBColor(0xF3, 0xF5, 0xFA)
WARN_BG = RGBColor(0xFF, 0xF4, 0xDC)
WARN_LINE = RGBColor(0xE0, 0xA7, 0x2E)
OK_BG = RGBColor(0xE6, 0xF6, 0xEE)
OK_LINE = RGBColor(0x2F, 0xBF, 0x71)
CODE_BG = RGBColor(0x1E, 0x23, 0x33)
CODE_FG = RGBColor(0xE6, 0xE9, 0xF2)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]
page = {"n": 0}


def _font(run, size, bold=False, color=TEXT, font=JP):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font
    # 東アジア文字のフォントも指定
    rpr = run._r.get_or_add_rPr()
    for tag in ("a:ea",):
        el = rpr.find("{http://schemas.openxmlformats.org/drawingml/2006/main}ea")
        if el is None:
            from lxml import etree
            el = etree.SubElement(rpr, "{http://schemas.openxmlformats.org/drawingml/2006/main}ea")
        el.set("typeface", font)


def textbox(slide, x, y, w, h, lines, size=16, color=TEXT, bold_first=False, font=JP, spacing=1.15, anchor=MSO_ANCHOR.TOP):
    """lines: list[str | (str, dict)]。'・' で始まる行は箇条書き風に表示"""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.05)
    for i, item in enumerate(lines):
        opts = {}
        if isinstance(item, tuple):
            item, opts = item
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.line_spacing = spacing
        p.space_after = Pt(opts.get("after", 4))
        r = p.add_run()
        r.text = item
        _font(r, opts.get("size", size), opts.get("bold", bold_first and i == 0), opts.get("color", color), opts.get("font", font))
    return tb


def rect(slide, x, y, w, h, fill, line=None, shape=MSO_SHAPE.RECTANGLE, radius=None):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1.25)
    s.shadow.inherit = False
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    return s


def shape_text(s, lines, size=14, color=TEXT, bold=False, align=PP_ALIGN.CENTER, font=JP):
    tf = s.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = tf.margin_right = Inches(0.08)
    for i, line in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = line
        _font(r, size if i == 0 else size - 2, bold and i == 0, color, font)


def new_slide(title, section=None):
    page["n"] += 1
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, SW, Inches(0.95), NAVY)
    rect(s, 0, Inches(0.95), SW, Inches(0.06), BLUE)
    textbox(s, Inches(0.5), Inches(0.14), Inches(10.5), Inches(0.7), [title], size=26, color=WHITE, bold_first=True, anchor=MSO_ANCHOR.MIDDLE)
    if section:
        textbox(s, Inches(10.3), Inches(0.24), Inches(2.6), Inches(0.5), [section], size=12, color=RGBColor(0xA9, 0xB6, 0xD6))
        s.shapes[-1].text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT
    tb = textbox(s, Inches(12.2), Inches(7.05), Inches(0.9), Inches(0.35), [str(page["n"])], size=10, color=MUTED)
    tb.text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT
    textbox(s, Inches(0.5), Inches(7.05), Inches(8), Inches(0.35), ["Midnight 開発環境 構築手順書（Windows 版）"], size=10, color=MUTED)
    return s


def code(slide, x, y, w, h, lines, size=13):
    box = rect(slide, x, y, w, h, CODE_BG, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.04)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.12)
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = line
        col = RGBColor(0x8F, 0x9B, 0xB8) if line.strip().startswith("#") else CODE_FG
        _font(r, size, False, col, MONO)
    return box


def callout(slide, x, y, w, h, title, lines, kind="warn", size=13):
    bg, ln = (WARN_BG, WARN_LINE) if kind == "warn" else (OK_BG, OK_LINE)
    box = rect(slide, x, y, w, h, bg, ln, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
    rect(slide, x, y, Inches(0.09), h, ln)
    items = [(("⚠ " if kind == "warn" else "✔ ") + title, {"bold": True, "size": size + 1})] + [(l, {"size": size}) for l in lines]
    textbox(slide, x + Inches(0.2), y + Inches(0.08), w - Inches(0.3), h - Inches(0.1), items, size=size, spacing=1.1)
    return box


def picture(slide, path, x, y, max_w, max_h, border=True):
    im = Image.open(path)
    ratio = im.width / im.height
    w, h = max_w, int(max_w / ratio)
    if h > max_h:
        h, w = max_h, int(max_h * ratio)
    px = x + int((max_w - w) / 2)
    pic = slide.shapes.add_picture(str(path), px, y, w, h)
    if border:
        pic.line.color.rgb = RGBColor(0xC8, 0xCE, 0xDB)
        pic.line.width = Pt(1)
    return pic


def table(slide, x, y, w, rows, col_w=None, size=12, row_h=Inches(0.42), header=True):
    nrows, ncols = len(rows), len(rows[0])
    shp = slide.shapes.add_table(nrows, ncols, x, y, w, row_h * nrows)
    t = shp.table
    if col_w:
        total = sum(col_w)
        for i, cw in enumerate(col_w):
            t.columns[i].width = int(w * cw / total)
    for r in range(nrows):
        t.rows[r].height = row_h
        for c in range(ncols):
            cell = t.cell(r, c)
            cell.margin_left = cell.margin_right = Inches(0.08)
            cell.margin_top = cell.margin_bottom = Inches(0.03)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            if header and r == 0:
                cell.fill.fore_color.rgb = NAVY2
            else:
                cell.fill.fore_color.rgb = WHITE if r % 2 else LIGHT
            tf = cell.text_frame
            tf.word_wrap = True
            tf.paragraphs[0].text = ""
            run = tf.paragraphs[0].add_run()
            run.text = rows[r][c]
            _font(run, size, header and r == 0, WHITE if header and r == 0 else TEXT, MONO if rows[r][c].startswith("`") else JP)
            if rows[r][c].startswith("`"):
                run.text = rows[r][c].strip("`")
    return shp


def arrow(slide, x, y, w, h):
    a = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x, y, w, h)
    a.fill.solid()
    a.fill.fore_color.rgb = RGBColor(0xA9, 0xB6, 0xD6)
    a.line.fill.background()
    return a


# =============================================================================
# 1. 表紙
s = prs.slides.add_slide(BLANK)
page["n"] += 1
rect(s, 0, 0, SW, SH, NAVY)
rect(s, Inches(0.8), Inches(3.55), Inches(1.4), Inches(0.08), BLUE)
textbox(s, Inches(0.8), Inches(1.7), Inches(11.5), Inches(1.0), ["Midnight 開発環境 構築手順書"], size=44, color=WHITE, bold_first=True)
textbox(s, Inches(0.8), Inches(2.65), Inches(11.5), Inches(0.8), ["Windows 11 × WSL2 × Rancher Desktop × Lace（Preview ネットワーク）"], size=22, color=RGBColor(0xA9, 0xB6, 0xD6))
textbox(s, Inches(0.8), Inches(3.9), Inches(11.5), Inches(1.8), [
    "対象: トークン化預金デモ（midnight_td_demo）を動かせる環境を、一から作る",
    "前提: リポジトリ https://github.com/101nimura/midnight_td_demo をクローンして使う",
    "範囲: クローン / WSL / Node.js / Compact / Proof Server / Lace（作成・インポート・アドレス）/ tNIGHT・DUST / 起動",
    "所要時間: 約 2〜3 時間（ダウンロード・同期の待ち時間を含む）",
], size=16, color=WHITE)
textbox(s, Inches(0.8), Inches(6.6), Inches(11.5), Inches(0.5), ["詳細版: docs/SETUP.md　／　デモの操作: README.md　／　課題: docs/ISSUES.md"], size=12, color=RGBColor(0x8F, 0x9B, 0xB8))

# 2. この手順書について
s = new_slide("この手順書のポイント", "はじめに")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.6), ["実際に構築したときのつまずきを踏まえ、「つまずかない順序」で並べています。順番どおりに進めてください。"], size=17)
pts = [
    ("クローンして使う", "スクリプトは置き場所を自動判定。改行コードは .gitattributes で固定済み"),
    ("バージョンを固定", "Compact 0.31.1 / midnight-js 4.1.1 / Proof Server 8.0.3 の組み合わせ"),
    ("Docker は「Running」を待つ", "起動しきる前の操作は docker_engine エラーになる"),
    ("社内 TLS 検査に先に対処", "Netskope 等があると Proof Server が起動直後に停止する"),
    ("DUST は自動では増えない", "登録が必要で、時間とともにたまる。0 だと全操作が失敗"),
    ("Lace の画面は版で違う", "ボタンが無い場合の代替手段（DUST ツール）を用意"),
]
for i, (h, d) in enumerate(pts):
    col, row = i % 3, i // 3
    x = Inches(0.6) + col * Inches(4.1)
    y = Inches(2.15) + row * Inches(2.35)
    b = rect(s, x, y, Inches(3.85), Inches(2.1), LIGHT, RGBColor(0xD5, 0xDB, 0xE8), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
    rect(s, x, y, Inches(3.85), Inches(0.09), BLUE)
    textbox(s, x + Inches(0.2), y + Inches(0.25), Inches(3.5), Inches(1.8), [(h, {"bold": True, "size": 18}), (d, {"size": 14, "color": MUTED})])

# 3. 全体構成
s = new_slide("0. 全体構成", "全体像")
win = rect(s, Inches(0.5), Inches(1.3), Inches(8.6), Inches(5.55), LIGHT, RGBColor(0xC8, 0xCE, 0xDB), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.03)
textbox(s, Inches(0.7), Inches(1.38), Inches(4), Inches(0.4), [("Windows 11", {"bold": True, "size": 15})])
br = rect(s, Inches(0.8), Inches(1.85), Inches(8.0), Inches(1.45), WHITE, BLUE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
textbox(s, Inches(0.95), Inches(1.9), Inches(3), Inches(0.4), [("Chrome / Edge", {"bold": True, "size": 13, "color": BLUE})])
a1 = rect(s, Inches(1.0), Inches(2.3), Inches(3.6), Inches(0.85), RGBColor(0xE8, 0xEE, 0xFF), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
shape_text(a1, ["デモアプリ", "localhost:5173 / 単一 HTML"], 14, bold=True)
a2 = rect(s, Inches(5.0), Inches(2.3), Inches(3.6), Inches(0.85), RGBColor(0xF0, 0xE8, 0xFF), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
shape_text(a2, ["Lace ウォレット拡張", "署名・手数料(DUST)・証明依頼"], 14, bold=True)
rd = rect(s, Inches(0.8), Inches(3.5), Inches(3.9), Inches(1.5), WHITE, RGBColor(0x2F, 0xBF, 0x71), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
shape_text(rd, ["Rancher Desktop（Docker）", "Proof Server  :6300", "ZK 証明を生成"], 14, bold=True)
wsl = rect(s, Inches(4.9), Inches(3.5), Inches(3.9), Inches(1.5), WHITE, WARN_LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
shape_text(wsl, ["WSL2 (Ubuntu)", "Node.js 24（nvm）", "Compact 0.31.1"], 14, bold=True)
textbox(s, Inches(0.8), Inches(5.25), Inches(8.0), Inches(1.5), [
    "・Lace → Proof Server に証明を依頼（http://localhost:6300）",
    "・WSL でビルドし、開発サーバー（Vite）を起動",
    "・ブラウザ → Midnight Preview（Indexer / Node）へ接続",
], size=13)
net = rect(s, Inches(9.6), Inches(1.3), Inches(3.25), Inches(5.55), NAVY2, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.05)
textbox(s, Inches(9.8), Inches(1.45), Inches(3), Inches(5.3), [
    ("Midnight Preview", {"bold": True, "size": 17, "color": WHITE}),
    ("（インターネット）", {"size": 12, "color": RGBColor(0xA9, 0xB6, 0xD6), "after": 16}),
    ("Node（RPC）", {"bold": True, "size": 14, "color": WHITE}),
    ("トランザクションの送信", {"size": 12, "color": RGBColor(0xA9, 0xB6, 0xD6), "after": 12}),
    ("Indexer", {"bold": True, "size": 14, "color": WHITE}),
    ("コントラクトの状態を参照", {"size": 12, "color": RGBColor(0xA9, 0xB6, 0xD6), "after": 12}),
    ("Faucet", {"bold": True, "size": 14, "color": WHITE}),
    ("テスト用 tNIGHT の配布", {"size": 12, "color": RGBColor(0xA9, 0xB6, 0xD6), "after": 12}),
    ("S3（パラメータ）", {"bold": True, "size": 14, "color": WHITE}),
    ("Proof Server が起動時に取得", {"size": 12, "color": RGBColor(0xA9, 0xB6, 0xD6)}),
])
arrow(s, Inches(9.15), Inches(3.9), Inches(0.42), Inches(0.4))

# 4. なぜこの構成か
s = new_slide("0. なぜこの構成なのか", "全体像")
table(s, Inches(0.6), Inches(1.4), Inches(12.1), [
    ["判断", "理由（構築時に実際に問題になった点）"],
    ["ビルドを WSL2 で行う", "Compact コンパイラは Linux / macOS 版のみ。SDK は Node.js 22 以上が必要（公式は 24）"],
    ["Docker は Rancher Desktop", "Proof Server は Docker イメージで提供（Docker Desktop でも可）"],
    ["Compact を 0.31.1 に固定", "最新 0.35 は RC 版ランタイム（0.20）向けのコードを出力し、安定版 SDK（0.16）で動かない"],
    ["Proof Server は 8.0.3", "ledger v8 系の SDK と合わせる。ずれると証明が通らない"],
    ["Lace の証明はローカルの Proof Server", "ブラウザ内（WASM）はメモリ不足で落ちることがある"],
], col_w=[3.2, 8.9], size=14, row_h=Inches(0.7))
callout(s, Inches(0.6), Inches(6.0), Inches(12.1), Inches(0.85), "バージョンは付録の組み合わせから変えないこと", ["ネットワークの更新で組み合わせが変わることがあります。変える場合は公式サンプル（example-bboard）の CI 設定を確認してください。"])

# 5. 用語
s = new_slide("0. 用語", "全体像")
table(s, Inches(0.6), Inches(1.4), Inches(12.1), [
    ["用語", "意味"],
    ["tNIGHT", "Preview 用の NIGHT トークン。Faucet で無料でもらえる"],
    ["DUST", "手数料に使うリソース。NIGHT を「DUST 生成」に登録すると、時間とともにたまる。tNIGHT を受け取っただけでは増えない"],
    ["Proof Server", "トランザクションのゼロ知識証明を作るサーバー。手元の Docker で動かす"],
    ["unshielded アドレス", "mn_addr_preview1…　Faucet の送り先"],
    ["shielded アドレス", "mn_shield-addr_preview1…　秘匿トークン用"],
    ["DUST アドレス", "mn_dust_preview1…　DUST の受け取り先"],
    ["リカバリーフレーズ", "ウォレットを復元するための 24 単語。他人に教えない・画像で保存しない"],
], col_w=[3.0, 9.1], size=14, row_h=Inches(0.62))

# 6. 作業の流れ
s = new_slide("0. 作業の流れ", "全体像")
steps = [("1", "事前確認|クローン", "15分"), ("2", "WSL2", "20分"), ("3", "Node.js", "10分"), ("4", "Compact", "10分"), ("5", "Docker|Proof|Server", "30分"),
         ("6", "Lace", "20分"), ("7", "tNIGHT|DUST", "20〜60分"), ("8", "アプリ|起動", "20分"), ("9", "動作|確認", "10分")]
for i, (n, name, t) in enumerate(steps):
    x = Inches(0.5) + i * Inches(1.39)
    c = rect(s, x, Inches(2.0), Inches(1.1), Inches(1.9), BLUE if i not in (4, 6) else WARN_LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    shape_text(c, [n] + name.split("|"), 22, WHITE, bold=True)
    for para in c.text_frame.paragraphs[1:]:
        for r in para.runs:
            r.font.size = Pt(13)
    if i < len(steps) - 1:
        arrow(s, x + Inches(1.12), Inches(2.82), Inches(0.25), Inches(0.26))
    textbox(s, x - Inches(0.1), Inches(4.05), Inches(1.3), Inches(0.4), [t], size=13, color=MUTED).text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
callout(s, Inches(0.6), Inches(4.9), Inches(12.1), Inches(1.6), "時間がかかる・つまずきやすい工程（オレンジ）", [
    "5: Rancher Desktop の起動待ち、イメージのダウンロード、社内 TLS 検査への対処",
    "7: Faucet の着金待ち、DUST の生成（Lace の画面にボタンが無い場合は代替ツール。初回同期 10〜15 分）",
])

# 7. 事前確認
s = new_slide("1. 事前確認", "1. 事前確認")
textbox(s, Inches(0.6), Inches(1.3), Inches(5.6), Inches(3.2), [
    ("必要なもの", {"bold": True, "size": 18}),
    "・Windows 11（WSL2 が使えること）",
    "・管理者権限（WSL・Rancher Desktop の導入）",
    "・メモリ 16GB 以上推奨 / ディスク空き 20GB 以上",
    "・Chrome または Edge",
    ("PowerShell で実行する", {"bold": True, "size": 18}),
    "・Git Bash から wsl を呼ぶとパスが書き換わる",
    "  → 使う場合は MSYS_NO_PATHCONV=1 を付ける",
], size=15)
textbox(s, Inches(6.6), Inches(1.3), Inches(6.2), Inches(0.5), [("社内 TLS 検査（Netskope 等）の有無を確認", {"bold": True, "size": 18})])
code(s, Inches(6.6), Inches(1.9), Inches(6.2), Inches(1.3), [
    "Get-ChildItem Cert:\\LocalMachine\\Root |",
    "  Where-Object { $_.Subject -like '*netskope*' } |",
    "  Select-Object Subject",
], size=13)
table(s, Inches(6.6), Inches(3.4), Inches(6.2), [
    ["結果", "対応"],
    ["何か表示された", "TLS 検査あり → 5.2 で社内証明書を取り込む"],
    ["何も表示されない", "TLS 検査なし（5.2 は同じ手順で実行）"],
], col_w=[2.2, 4.0], size=13)
callout(s, Inches(6.6), Inches(4.9), Inches(6.2), Inches(1.3), "Windows の curl.exe での接続確認", ["社内環境では証明書の失効確認に失敗することがある（CRYPT_E_NO_REVOCATION_CHECK）→ --ssl-no-revoke を付ける"])

# 7b. クローン
s = new_slide("1.4 Git のインストールとリポジトリのクローン", "1. 事前確認")
textbox(s, Inches(0.6), Inches(1.25), Inches(12), Inches(0.5), ["Git for Windows（https://git-scm.com/download/win、設定は既定のまま）を入れ、空白・日本語・OneDrive を含まないフォルダにクローンする。"], size=15)
code(s, Inches(0.6), Inches(1.85), Inches(6.3), Inches(1.75), [
    "mkdir C:\\work -Force",
    "cd C:\\work",
    "git clone https://github.com/101nimura/midnight_td_demo.git",
    "cd midnight_td_demo     # = リポジトリのフォルダ",
], size=13)
textbox(s, Inches(7.2), Inches(1.85), Inches(5.5), Inches(1.8), [
    "・ダウンロードは約 100MB（ZK 証明鍵・単一 HTML を含む）",
    "・以降の PowerShell コマンドはリポジトリのフォルダで実行",
    "・*.cmd は自分の場所を基準に動く → どこに置いても書き換え不要",
], size=14)
table(s, Inches(0.6), Inches(3.85), Inches(12.1), [
    ["区分", "内容", "用意の仕方"],
    ["含まれる", "コンパイル済みコントラクト（ZK 鍵込み）・ソース・スクリプト・docs・単一 HTML", "クローンのみ（再コンパイル不要）"],
    ["含まれない", "node_modules/", "npm-install.cmd（8.1）"],
    ["含まれない", "certs/（Proof Server 用 CA バンドル）", "make-ca-bundle.cmd（5.2）"],
    ["含まれない", "tools/dust/node_modules/・DUST ツールのシード", "dust-install.cmd（7.3）・シードは自動作成"],
], col_w=[1.6, 6.2, 4.3], size=13, row_h=Inches(0.48))
callout(s, Inches(0.6), Inches(6.35), Inches(12.1), Inches(0.6), "改行コード: *.sh は .gitattributes で LF に固定。$'\\r': command not found が出たら git pull → git rm --cached -r . → git reset --hard", [], size=12)

# 8. WSL
s = new_slide("2. WSL2 と Ubuntu", "2. WSL2")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.5), [("管理者の PowerShell で実行", {"bold": True, "size": 18})])
code(s, Inches(0.6), Inches(1.9), Inches(12.1), Inches(1.0), ["wsl --install -d Ubuntu", "# 再起動後、Ubuntu のユーザー名・パスワードを設定（Ubuntu = 24.04 LTS）"], size=15)
textbox(s, Inches(0.6), Inches(3.2), Inches(12), Inches(0.5), [("確認", {"bold": True, "size": 18})])
code(s, Inches(0.6), Inches(3.8), Inches(12.1), Inches(1.4), ["wsl -l -v", "#   NAME            STATE      VERSION", "# * Ubuntu          Running    2      ← VERSION 2 なら OK"], size=15)
callout(s, Inches(0.6), Inches(5.55), Inches(12.1), Inches(1.0), "ディストリビューション名", ["スクリプトは「Ubuntu」で動く。別名（例: Ubuntu-24.04）なら環境変数 WSL_DISTRO に設定する。"], kind="ok")

# 9. Node
s = new_slide("3. Node.js（WSL 内）", "3. Node.js")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.5), [("wsl -d Ubuntu で Ubuntu に入り、nvm で Node.js 24 を入れる", {"bold": True, "size": 18})])
code(s, Inches(0.6), Inches(1.9), Inches(12.1), Inches(2.2), [
    "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash",
    "source ~/.bashrc",
    "nvm install 24",
    "node -v        # v24.x と表示されれば OK",
], size=15)
callout(s, Inches(0.6), Inches(4.45), Inches(5.9), Inches(1.9), "Windows 側の Node.js は使わない", ["C:\\Program Files\\nodejs が古くても問題なし。", "midnight-js は Node 22 以上が必要。"], kind="ok")
callout(s, Inches(6.8), Inches(4.45), Inches(5.9), Inches(1.9), "PATH の引き継ぎに注意", ["Windows の PATH（空白を含む）が WSL に引き継がれ、設定が崩れることがある。", "→ プロジェクトでは .tools/env.sh で設定し直してから実行。"])

# 10. Compact
s = new_slide("4. Compact コンパイラ（WSL 内）", "4. Compact")
code(s, Inches(0.6), Inches(1.35), Inches(12.1), Inches(2.0), [
    "curl --proto '=https' --tlsv1.2 -LsSf \\",
    "  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh",
    "source ~/.bashrc",
    "compact update 0.31.1          # ★ 必ずこのバージョンに固定",
    "compact compile --version      # 0.31.1",
], size=15)
callout(s, Inches(0.6), Inches(3.7), Inches(5.9), Inches(2.6), "最新版を使わない", [
    "compact update だけだと最新（0.35 等）が入る。",
    "出力コードが compact-runtime 0.20 向けになり、安定版 midnight-js 4.1.1（0.16）では",
    "checkRuntimeVersion エラーで動かない。",
])
callout(s, Inches(6.8), Inches(3.7), Inches(5.9), Inches(2.6), "Windows の compact.exe と別物", [
    "C:\\Windows\\System32\\compact.exe は NTFS 圧縮ツール。",
    "PowerShell で compact と打つとこちらが動く。",
    "Compact コンパイラは必ず WSL の中で実行する。",
])

# 11. Rancher
s = new_slide("5.1 Rancher Desktop のインストール", "5. Docker")
textbox(s, Inches(0.6), Inches(1.3), Inches(6.3), Inches(4.5), [
    "1. https://rancherdesktop.io/ から Windows 版を入手・インストール（管理者権限）",
    "2. 初回設定",
    ("    Container Engine: dockerd (moby)", {"bold": True}),
    "    （containerd だと docker コマンドが使えない）",
    "    Kubernetes: 不要なら OFF（ON だと起動に数分余計にかかる）",
    ("3. 画面下部が「Running」になるまで待つ", {"bold": True}),
    "4. PowerShell で確認",
], size=16)
code(s, Inches(0.6), Inches(5.0), Inches(6.3), Inches(0.75), ["docker info     # Server Version: ... が出れば OK"], size=14)
callout(s, Inches(7.2), Inches(1.3), Inches(5.5), Inches(3.0), "起動しきる前に docker を実行すると…", [
    "error during connect: in the default daemon",
    "configuration on Windows ... open //./pipe/docker_engine:",
    "The system cannot find the file specified.",
    "",
    "→ 故障ではない。Running になるまで待って再実行。",
])
callout(s, Inches(7.2), Inches(4.6), Inches(5.5), Inches(1.6), "PC を再起動したあと", ["Rancher Desktop が Running → Proof Server 起動、の順番を毎回守る。"], kind="ok")

# 12. TLS
s = new_slide("5.2 Proof Server 用の CA バンドルを作る（全員）", "5. Docker")
textbox(s, Inches(0.6), Inches(1.25), Inches(12), Inches(0.5), ["Proof Server は起動時に S3 からパラメータを取得する。社内証明書をコンテナが信頼できないと失敗して停止する。"], size=15)
steps3 = [("Windows 証明書ストア", "社内ルート証明書\n（Netskope 等）"), ("make-ca-bundle.cmd", "PEM に書き出し\n標準 CA と結合"), ("certs\\ca-bundle.crt", "CA バンドル"), ("proof-server.yml", "コンテナにマウント\nSSL_CERT_FILE")]
for i, (h, d) in enumerate(steps3):
    x = Inches(0.6) + i * Inches(3.15)
    b = rect(s, x, Inches(1.9), Inches(2.65), Inches(1.4), LIGHT, BLUE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    shape_text(b, [h] + d.split("\n"), 14, bold=True)
    if i < 3:
        arrow(s, x + Inches(2.7), Inches(2.4), Inches(0.4), Inches(0.4))
code(s, Inches(0.6), Inches(3.6), Inches(6.2), Inches(1.3), ["# リポジトリのフォルダで", ".\\make-ca-bundle.cmd", "# Zscaler 等: .tools\\make-ca-bundle.ps1 -Pattern '*zscaler*'"], size=13)
code(s, Inches(7.1), Inches(3.6), Inches(5.6), Inches(1.3), ["# 失敗時のログ（例）", "Failed to fetch data from https://midnight-s3-", "fileshare-dev-eu-west-1... after 3 attempts."], size=12)
callout(s, Inches(0.6), Inches(5.2), Inches(12.1), Inches(1.3), "TLS 検査がない環境でも実行する", ["proof-server.yml は certs/ca-bundle.crt を必ず読み込む。社内証明書が無ければ標準 CA のみで作成される。"], kind="ok")

# 13. Proof server
s = new_slide("5.3 Proof Server の起動と確認", "5. Docker")
code(s, Inches(0.6), Inches(1.35), Inches(7.2), Inches(1.6), [
    "# リポジトリのフォルダで",
    "docker compose -f proof-server.yml up -d",
    "docker compose -f proof-server.yml logs -f   # Ctrl+C で抜ける",
], size=14)
textbox(s, Inches(0.6), Inches(3.2), Inches(7.2), Inches(3.0), [
    "・初回はイメージ（約 1GB）とパラメータのダウンロードで数分",
    "・ログに listening on: 0.0.0.0:6300 が出れば起動完了",
    "・パラメータはボリュームに保存 → 2 回目以降は速い",
    "・停止: docker compose -f proof-server.yml down",
], size=16)
ok = rect(s, Inches(8.2), Inches(1.35), Inches(4.5), Inches(2.6), OK_BG, OK_LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
textbox(s, Inches(8.45), Inches(1.5), Inches(4.1), Inches(2.4), [
    ("確認", {"bold": True, "size": 18}),
    ("ブラウザで開く", {"size": 14, "color": MUTED}),
    ("http://localhost:6300/version", {"size": 16, "font": MONO, "bold": True}),
    ("表示が 8.0.3 なら OK", {"size": 16, "bold": True, "color": RGBColor(0x1E, 0x8E, 0x55)}),
])
callout(s, Inches(8.2), Inches(4.25), Inches(4.5), Inches(1.9), "すぐ止まる場合", ["docker ps に出てこない → 5.2（CA バンドル）を確認。", "ログに S3 のエラーが出ているはず。"])

# 14. Lace install & wallet
s = new_slide("6.1〜6.2 Lace のインストールとウォレットの用意", "6. Lace")
textbox(s, Inches(0.6), Inches(1.25), Inches(12), Inches(0.5), ["Chrome Web Store / Edge アドオンで「Lace」（提供元: Input Output）を追加。画面は版によって大きく変わるので、近いボタンを探す。"], size=15)
for i, (title, lines) in enumerate([
    ("A. 新しく作る（推奨）", [
        "1. 「ウォレットを作成」",
        "2. リカバリーフレーズ（24 単語）を紙に書き写して保管",
        "   ※ スクリーンショット・クラウド保存は不可",
        "3. 確認のために単語を入力",
        "4. Lace のパスワードを設定",
        "→ デモ・検証専用にし、本番資産と分ける",
    ]),
    ("B. 既存のウォレットをインポート", [
        "1. 「ウォレットを復元」（インポート）",
        "2. 保管しているリカバリーフレーズ（24 単語）を入力",
        "3. パスワードを設定",
        "4. 同期の完了を待つ（数分）",
        "→ フレーズを口頭・チャットで伝えない",
        "→ 他人の PC へは A を推奨",
    ]),
]):
    x = Inches(0.6) + i * Inches(6.2)
    rect(s, x, Inches(1.95), Inches(5.9), Inches(4.6), LIGHT, RGBColor(0xD5, 0xDB, 0xE8), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.04)
    rect(s, x, Inches(1.95), Inches(5.9), Inches(0.6), BLUE if i == 0 else NAVY2, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
    textbox(s, x + Inches(0.2), Inches(2.0), Inches(5.5), Inches(0.5), [title], size=18, color=WHITE, bold_first=True, anchor=MSO_ANCHOR.MIDDLE)
    textbox(s, x + Inches(0.25), Inches(2.75), Inches(5.5), Inches(3.7), lines, size=15)

# 15. Preview & portfolio
s = new_slide("6.3 Midnight（Preview）を有効にする", "6. Lace")
picture(s, IMG / "lace-portfolio.png", Inches(0.6), Inches(1.25), Inches(3.5), Inches(5.65))
textbox(s, Inches(4.6), Inches(1.4), Inches(8.1), Inches(4.5), [
    ("手順", {"bold": True, "size": 18}),
    "1. 設定（歯車）→ ネットワーク / Midnight の設定で Preview を選ぶ",
    "2. ポートフォリオに Midnight のアカウント（Midnight #0）が表示されることを確認",
    "3. tNIGHT を受け取ると、トークン一覧に表示される（7 章）",
    ("画面下部のメニュー（左から）", {"bold": True, "size": 18}),
    "ポートフォリオ ／ アクティビティ ／ Lace ／ 設定（歯車）／ 送信",
    ("上部の ↓ ボタン", {"bold": True, "size": 18}),
    "受信 = 自分のアドレスの表示（6.5）",
], size=15)

# 16. Proof server setting
s = new_slide("6.4 証明サーバー（Proof Server）を設定する", "6. Lace")
picture(s, IMG / "lace-midnight-settings.png", Inches(0.6), Inches(1.25), Inches(3.5), Inches(5.65))
textbox(s, Inches(4.6), Inches(1.4), Inches(8.1), Inches(1.5), [
    ("設定 → Midnight設定", {"bold": True, "size": 18}),
    "1. 「カスタムプルーフサーバー」を選び http://localhost:6300 を指定",
    "2. 「設定を保存」",
], size=15)
table(s, Inches(4.6), Inches(3.1), Inches(8.1), [
    ["選択肢", "説明"],
    ["このアプリで実行（WASM）", "ブラウザ内で証明。Docker 不要だが、メモリ不足で Lace が落ちることがある"],
    ["カスタムプルーフサーバー（推奨）", "5.3 の Proof Server を使用。安定"],
], col_w=[3.0, 5.1], size=13, row_h=Inches(0.6))
callout(s, Inches(4.6), Inches(5.2), Inches(8.1), Inches(1.3), "ノード / インデクサーのアドレス", ["Lace が使う接続先（構築時は Blockfrost）。デモアプリは Lace から受け取って使うので変更不要。"], kind="ok")

# 17. Addresses
s = new_slide("6.5 アドレスの確認と追加", "6. Lace")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["アドレス", "形式", "使い道", "確認方法"],
    ["unshielded", "`mn_addr_preview1…", "Faucet から tNIGHT を受け取る", "ポートフォリオで ↓（受信）"],
    ["shielded", "`mn_shield-addr_preview1…", "秘匿トークンの受け取り", "受信画面で切り替え"],
    ["DUST", "`mn_dust_preview1…", "DUST の受け取り先", "Lace に出ないことがある → デモアプリ右上（8.4）"],
], col_w=[1.7, 3.3, 3.2, 3.9], size=14, row_h=Inches(0.62))
callout(s, Inches(0.6), Inches(4.2), Inches(5.9), Inches(2.2), "アドレス（アカウント）を追加する", [
    "ポートフォリオ上部「1 ウォレット / ○ アカウント」から「アカウントを追加」。",
    "新しいアドレスの組ができる。",
], kind="ok")
callout(s, Inches(6.8), Inches(4.2), Inches(5.9), Inches(2.2), "デモアプリでは 1 アカウントで足りる", [
    "銀行・利用者A・利用者B は、アプリ内の「口座鍵」で切り替える。",
    "手数料はすべて接続中の Lace アカウントが払う。",
], kind="ok")

# 18. DUST 仕組み
s = new_slide("7. DUST のしくみ（ここが一番つまずく）", "7. tNIGHT / DUST")
flow = [("Faucet", "tNIGHT を\n受け取る"), ("DUST 生成に登録", "NIGHT の UTXO を\n登録（Tx）"), ("DUST がたまる", "時間とともに\n少しずつ増える"), ("手数料に使う", "デプロイ・\n各操作")]
for i, (h, d) in enumerate(flow):
    x = Inches(0.6) + i * Inches(3.15)
    b = rect(s, x, Inches(1.5), Inches(2.65), Inches(1.7), BLUE if i != 1 else WARN_LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
    shape_text(b, [h] + d.split("\n"), 17, WHITE, bold=True)
    if i < 3:
        arrow(s, x + Inches(2.7), Inches(2.15), Inches(0.4), Inches(0.4))
callout(s, Inches(0.6), Inches(3.55), Inches(12.1), Inches(1.15), "DUST が 0 だと、デプロイを含むすべての操作が手数料不足で失敗する", ["tNIGHT を受け取っただけでは増えない。オレンジの「登録」が別に必要。"])
textbox(s, Inches(0.6), Inches(4.95), Inches(12.1), Inches(1.8), [
    ("登録の方法は 2 つ", {"bold": True, "size": 18}),
    "方法 A: Lace の「Generate tDUST」ボタン（公式手順の Lace 1.36.0 ではトークン画面にある）",
    "方法 B: 代替ツール（tools/dust）— 別のウォレットの NIGHT から、Lace の DUST アドレス宛てに生成させる（designation）",
    "         構築時の新しい Lace UI ではボタンが見つからず、方法 B で解決した。リカバリーフレーズは不要。",
], size=15)

# 19. tNIGHT
s = new_slide("7.1 tNIGHT を受け取る", "7. tNIGHT / DUST")
picture(s, IMG / "lace-tnight-activity.png", Inches(0.6), Inches(1.25), Inches(3.5), Inches(5.65))
textbox(s, Inches(4.6), Inches(1.4), Inches(8.1), Inches(3.0), [
    ("手順", {"bold": True, "size": 18}),
    "1. Lace の unshielded アドレス（mn_addr_preview1…）をコピー",
    ("2. ブラウザで公式 Faucet を開く: https://faucet.preview.midnight.network/", {"bold": True}),
    "3. アドレスを貼り付けて請求",
    "4. 数分後、Lace に tNIGHT が表示される（左図: 5,000 tNIGHT の着金）",
], size=16)
callout(s, Inches(4.6), Inches(4.6), Inches(8.1), Inches(1.6), "Faucet は「ブラウザの画面」から請求する", [
    "Faucet API は「OK」を返しても届かないことがあった（1 時間以上待っても 0）。",
    "ブラウザから請求した分は約 3 分で着金した。",
])

# 20. 方法A
s = new_slide("7.2 DUST の生成 ― 方法 A: Lace の画面から", "7. tNIGHT / DUST")
picture(s, IMG / "lace-tnight-detail.png", Inches(0.6), Inches(1.25), Inches(3.5), Inches(5.65))
textbox(s, Inches(4.6), Inches(1.4), Inches(8.1), Inches(2.5), [
    ("手順（公式手順: Lace 1.36.0）", {"bold": True, "size": 18}),
    "1. トークン → 「Generate tDUST」（「DUST を生成」など）",
    "2. 承認する",
    "3. 数分〜十数分待つ（DUST は少しずつたまる）",
], size=16)
callout(s, Inches(4.6), Inches(4.0), Inches(8.1), Inches(2.2), "ボタンが見つからない場合 → 方法 B へ", [
    "構築時の新しい Lace（ポートフォリオ画面の UI）では、トークン一覧・tNIGHT 詳細（左図）・",
    "アカウント画面・設定のどこにも見当たらなかった。",
    "Lace の画面に DUST が出ていなくても、デモアプリ右上で実際の残高を確認できる。",
])

# 21. 方法B
s = new_slide("7.3 DUST の生成 ― 方法 B: 代替ツール", "7. tNIGHT / DUST")
fl = [("ツール専用ウォレット", "tNIGHT を保有"), ("DUST 生成に登録", "受取先 = Lace の\nDUST アドレス"), ("Lace", "DUST がたまる\n→ 手数料を払える")]
for i, (h, d) in enumerate(fl):
    x = Inches(0.6) + i * Inches(4.15)
    b = rect(s, x, Inches(1.35), Inches(3.6), Inches(1.3), [NAVY2, WARN_LINE, BLUE][i], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
    shape_text(b, [h] + d.split("\n"), 16, WHITE, bold=True)
    if i < 2:
        arrow(s, x + Inches(3.67), Inches(1.8), Inches(0.42), Inches(0.4))
code(s, Inches(0.6), Inches(2.95), Inches(6.3), Inches(1.5), [
    "# 事前: Proof Server を起動（5.3）／ 初回のみ install",
    ".\\dust-install.cmd",
    "# 引数 = Lace の DUST アドレス",
    ".\\dust-designate.cmd mn_dust_preview1...",
], size=12)
textbox(s, Inches(7.2), Inches(2.9), Inches(5.5), Inches(3.6), [
    ("ツールの進み方", {"bold": True, "size": 16}),
    "1. 専用ウォレットを作成（シードを保存）",
    "2. 同期（初回 10〜15 分）",
    "3. tNIGHT が 0 → Faucet 請求＆着金待ち",
    "   届かなければ、ログのアドレス宛てに",
    "   ブラウザで Faucet 請求（送り先はツール側）",
    "4. 登録 Tx を送信（ZK 証明 約 20 秒）",
    "5. 数分後、アプリ右上「DUST: 再取得」",
], size=14)
callout(s, Inches(0.6), Inches(4.65), Inches(6.3), Inches(1.85), "同期が止まったら", [
    "Wallet.Sync: ErrorEvent のあと進まない → Ctrl+C で止めて再実行。",
    "シードは tools\\dust\\.demo-wallet-seed に保存済みなので、同じウォレットで続行できる。",
])

# 22. Project setup
s = new_slide("8.1〜8.2 依存パッケージのインストールとテスト", "8. アプリ")
code(s, Inches(0.6), Inches(1.35), Inches(12.1), Inches(1.9), [
    "# リポジトリのフォルダで",
    ".\\npm-install.cmd      # 依存パッケージ（数分）",
    ".\\run-tests.cmd        # 9 passed なら OK",
], size=15)
callout(s, Inches(0.6), Inches(3.6), Inches(12.1), Inches(1.3), "コンパイルは不要", ["コンパイル済みのコントラクト（ZK 証明鍵を含む）はリポジトリに入っている。tdeposit.compact を変更したときだけ .\\compile-contract.cmd（数分）。"], kind="ok")
callout(s, Inches(0.6), Inches(5.15), Inches(12.1), Inches(1.3), "インストールが遅い", ["Windows 側のフォルダに WSL からアクセスするため。故障ではない。"], kind="ok")

# 23. Start & connect
s = new_slide("8.3〜8.4 起動して Lace に接続する", "8. アプリ")
code(s, Inches(0.6), Inches(1.3), Inches(4.6), Inches(0.75), [".\\start-dev.cmd   # → http://localhost:5173"], size=14)
picture(s, IMG / "app-start.png", Inches(0.6), Inches(2.25), Inches(6.0), Inches(3.4))
picture(s, IMG / "app-connected.png", Inches(6.9), Inches(1.3), Inches(5.85), Inches(3.0))
textbox(s, Inches(6.9), Inches(4.45), Inches(5.85), Inches(2.4), [
    ("接続後、右上を確認", {"bold": True, "size": 16}),
    "・network=preview",
    "・DUST 残高 / 上限 / DUST アドレス（コピー可）",
    "・DUST が 0 → 7 章へ。0 より大きければ準備完了",
], size=14)
textbox(s, Inches(0.6), Inches(5.8), Inches(6.0), Inches(1.2), [
    "・Port 5173 is already in use → 既存サーバーを止めるか、そのまま使う",
    "・設定ファイルを変えたら開発サーバーを再起動",
], size=13, color=MUTED)

# 24. Single HTML
s = new_slide("8.5 単一 HTML 版", "8. アプリ")
code(s, Inches(0.6), Inches(1.35), Inches(12.1), Inches(1.2), [".\\build-single.cmd   # dist-single\\tdeposit-demo.html（約 55MB）", ".\\start-single.cmd   # http://localhost:8080/tdeposit-demo.html"], size=14)
table(s, Inches(0.6), Inches(2.85), Inches(12.1), [
    ["開き方", "手順", "注意"],
    ["A. HTTP で配信（推奨）", "start-single.cmd を実行し、URL を開く", "Windows の Python を使用"],
    ["B. ファイルを直接開く", "HTML をブラウザにドラッグ＆ドロップ", "Lace の「ファイルの URL へのアクセスを許可する」を ON にする"],
], col_w=[2.6, 4.6, 4.9], size=14, row_h=Inches(0.62))
callout(s, Inches(0.6), Inches(5.0), Inches(12.1), Inches(1.5), "開いた URL ごとに保存領域が別", [
    "localhost:5173 / localhost:8080 / file:// で、口座鍵とコントラクトアドレスは引き継がれない。",
    "同じコントラクトを使うには「既存コントラクトに接続」でアドレスを入力（銀行の操作はデプロイしたときの口座鍵が必要）。",
])

# 25. 動作確認
s = new_slide("9. 動作確認チェックリスト", "9. 確認")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["#", "確認項目", "期待する結果"],
    ["1", "wsl -d Ubuntu --cd . -- bash -c \". .tools/env.sh && node -v\"", "v24.x"],
    ["2", "wsl -d Ubuntu --cd . -- bash -c \". .tools/env.sh && compact compile --version\"", "0.31.1"],
    ["3", "docker info", "エラーが出ない"],
    ["4", "http://localhost:6300/version", "8.0.3"],
    ["5", "run-tests.cmd", "9 passed"],
    ["6", "デモアプリで「Lace に接続」", "network=preview、DUST > 0"],
    ["7", "「新規デプロイ」", "数分後に「デプロイ完了: 0200…」"],
], col_w=[0.6, 6.5, 5.0], size=15, row_h=Inches(0.58))
callout(s, Inches(0.6), Inches(6.2), Inches(12.1), Inches(0.65), "すべて OK なら README「6. デモシナリオ」へ", [], kind="ok")

# 26-27. Troubleshooting
trouble = [
    ["症状", "原因", "対処"],
    ["C:/Program Files/Git/mnt/c/... No such file", "Git Bash のパス変換", "PowerShell で実行 / MSYS_NO_PATHCONV=1"],
    ["compact で圧縮ツールのような出力", "Windows の compact.exe", "WSL の中で実行"],
    ["checkRuntimeVersion エラー", "Compact のバージョン違い", "compact update 0.31.1 → 再コンパイル"],
    ["//./pipe/docker_engine エラー", "Rancher Desktop 起動中", "Running まで待つ"],
    ["Proof Server がすぐ止まる", "社内 TLS 検査", "make-ca-bundle.cmd → 再起動"],
    ["Lace ウォレットが見つかりません", "拡張無効 / file:// の許可 OFF", "有効化 / 許可 ON / http で開く"],
    ["$'\\r': command not found", "古い状態でクローン（改行 CRLF）", "git pull → git rm --cached -r . → git reset --hard"],
]
trouble2 = [
    ["症状", "原因", "対処"],
    ["Generate tDUST が見つからない", "Lace の版による UI の違い", "7.3 の代替ツール"],
    ["DUST がずっと 0", "未登録 / 登録直後", "7.2・7.3、数分〜十数分待つ"],
    ["Faucet が OK なのに着金しない", "Faucet API の不具合", "ブラウザの Faucet 画面から請求"],
    ["DUST ツールの同期が止まる", "一時的な WebSocket エラー", "Ctrl+C → 再実行"],
    ["コードを変えても画面が変わらない", "変更を検知していない", "開発サーバーを再起動"],
    ["Port 5173 is already in use", "サーバーが二重起動", "既存を止める / そのまま使う"],
]
for i, rows in enumerate([trouble, trouble2]):
    s = new_slide(f"10. トラブルシューティング（{i + 1}/2）", "10. トラブル")
    table(s, Inches(0.6), Inches(1.35), Inches(12.1), rows, col_w=[4.3, 3.4, 4.4], size=14, row_h=Inches(0.66))

# 28. 付録
s = new_slide("付録. バージョンと接続先", "付録")
table(s, Inches(0.6), Inches(1.35), Inches(5.9), [
    ["コンポーネント", "バージョン"],
    ["Compact コンパイラ", "0.31.1"],
    ["compact-runtime", "0.16.0"],
    ["midnight-js", "4.1.1"],
    ["dapp-connector-api", "4.0.1"],
    ["wallet-sdk（DUST ツール）", "1.2.0"],
    ["Proof Server", "8.0.3"],
    ["Node.js（WSL）", "24.x"],
    ["Vite", "8.x"],
], col_w=[3.4, 2.5], size=14, row_h=Inches(0.52))
table(s, Inches(6.8), Inches(1.35), Inches(5.9), [
    ["用途", "URL"],
    ["Indexer", "`https://indexer.preview.midnight.network/api/v4/graphql"],
    ["Node（RPC）", "`https://rpc.preview.midnight.network"],
    ["公式 Faucet", "`https://faucet.preview.midnight.network/"],
    ["Faucet API（ツール用）", "`https://midnight-tmnight-preview.nethermind.dev/"],
    ["リポジトリ", "`https://github.com/101nimura/midnight_td_demo"],
    ["Proof Server", "`http://localhost:6300"],
], col_w=[1.6, 4.3], size=12, row_h=Inches(0.55))
callout(s, Inches(6.8), Inches(5.45), Inches(5.9), Inches(1.2), "デモアプリの接続先", ["Lace の設定（getConfiguration）から受け取る。Lace 側の設定が優先される。"], kind="ok")

prs.save(OUT)
print(f"saved {OUT} ({page['n']} slides)")
