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
    textbox(s, Inches(0.5), Inches(7.05), Inches(8), Inches(0.35), ["Midnight 開発環境 構築手順書（Windows 版）2026-11-10 改訂"], size=10, color=MUTED)
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




PALE = RGBColor(0xA9, 0xB6, 0xD6)
BORDER = RGBColor(0xD5, 0xDB, 0xE8)


def two_col_pic(s, lines, img, size=15, left_w=5.6, pic_top=1.35, pic_h=5.4):
    """左に説明、右に画像"""
    textbox(s, Inches(0.6), Inches(1.35), Inches(left_w), Inches(5.5), lines, size=size)
    x = Inches(0.6 + left_w + 0.3)
    picture(s, IMG / img, x, Inches(pic_top), SW - x - Inches(0.5), Inches(pic_h))


# =============================================================================
# 1. 表紙
s = prs.slides.add_slide(BLANK)
page["n"] += 1
rect(s, 0, 0, SW, SH, NAVY)
rect(s, Inches(0.8), Inches(3.55), Inches(1.4), Inches(0.08), BLUE)
textbox(s, Inches(0.8), Inches(1.7), Inches(11.5), Inches(1.0), ["Midnight 開発環境 構築手順書"], size=44, color=WHITE, bold_first=True)
textbox(s, Inches(0.8), Inches(2.65), Inches(11.5), Inches(0.8), ["Windows 11 × 1AM ウォレット × Pactora デモ（Preview ネットワーク・ledger 9）"], size=22, color=PALE)
textbox(s, Inches(0.8), Inches(3.9), Inches(11.5), Inches(2.2), [
    "対象: Pactora トークン化預金デモ（midnight_td_demo）を動かせる環境を作る",
    "コース A: 公開中のデモを動かすだけ（1AM + tNIGHT + DUST）… 約 30〜60 分",
    "コース B: ローカルでビルド・開発する（+ Git / WSL / Node.js / Compact / Docker）… +1〜2 時間",
    "デモ: https://101nimura.github.io/midnight_td_demo/",
    "2026-11-10 改訂（Preview の再起動・ledger 9 対応）",
], size=16, color=WHITE)
textbox(s, Inches(0.8), Inches(6.6), Inches(11.5), Inches(0.5), ["詳細版: docs/SETUP.md　／　デモの操作: README.md　／　課題: docs/ISSUES.md・docs/TOKENIZED_DEPOSIT_ISSUES.md"], size=12, color=RGBColor(0x8F, 0x9B, 0xB8))

# 2. 改訂のポイント
s = new_slide("2026-11-10 改訂のポイント", "はじめに")
table(s, Inches(0.6), Inches(1.3), Inches(12.1), [
    ["項目", "初版（11/2）", "改訂（11/10）", "理由"],
    ["Preview", "ledger 8 のチェーン", "11/7 に ledger 9 で再起動", "公式の更新。tNIGHT・DUST・コントラクトは消えた（#35）"],
    ["ウォレット", "Lace", "1AM", "Lace の接続先（Blockfrost）が古いチェーンのまま（#36）"],
    ["DUST の用意", "代替ツール（dust-designate）", "1AM の画面で生成", "ツールは ledger 8 用で使えない（#38）"],
    ["Proof Server", "8.0.3（必須）", "9.0.0（1AM なら不要）", "1AM はウォレット側で証明を作る"],
    ["SDK / コンパイラ", "midnight-js 4.1.1 / 0.31.1", "midnight-js 5.0.0 / 0.36.0", "ledger 9 への対応（#37, #38）"],
    ["デモ", "React 版・単一 HTML", "Pactora UI 版（Pages）", "ZK 鍵が約 108MB で HTML に入らない（#38）"],
], col_w=[1.7, 2.9, 3.0, 4.5], size=13, row_h=Inches(0.62))
callout(s, Inches(0.6), Inches(5.9), Inches(12.1), Inches(0.95), "11/2 に動いていた環境が、コードを変えずに 1 週間で動かなくなった", [
    "テストネットはリセット・更新される前提で、毎回 1.3 の「Preview の状態確認」から始めてください。"])

# 3. 全体構成
s = new_slide("0.1 全体構成", "全体像")
rect(s, Inches(0.5), Inches(1.3), Inches(8.6), Inches(5.55), LIGHT, RGBColor(0xC8, 0xCE, 0xDB), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.03)
textbox(s, Inches(0.7), Inches(1.38), Inches(4), Inches(0.4), [("Windows 11", {"bold": True, "size": 15})])
rect(s, Inches(0.8), Inches(1.85), Inches(8.0), Inches(1.45), WHITE, BLUE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
textbox(s, Inches(0.95), Inches(1.9), Inches(3), Inches(0.4), [("Chrome / Edge", {"bold": True, "size": 13, "color": BLUE})])
a1 = rect(s, Inches(1.0), Inches(2.3), Inches(3.6), Inches(0.85), RGBColor(0xE8, 0xEE, 0xFF), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
shape_text(a1, ["Pactora デモ", "GitHub Pages / localhost:8081"], 14, bold=True)
a2 = rect(s, Inches(5.0), Inches(2.3), Inches(3.6), Inches(0.85), RGBColor(0xF0, 0xE8, 0xFF), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
shape_text(a2, ["1AM ウォレット拡張", "手数料(DUST)・署名・ZK 証明"], 14, bold=True)
rd = rect(s, Inches(0.8), Inches(3.5), Inches(3.9), Inches(1.5), WHITE, RGBColor(0x2F, 0xBF, 0x71), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
shape_text(rd, ["Rancher Desktop（Docker）", "Proof Server 9.0.0  :6300", "コース B で必要な場合のみ"], 14, bold=True)
wsl = rect(s, Inches(4.9), Inches(3.5), Inches(3.9), Inches(1.5), WHITE, WARN_LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
shape_text(wsl, ["WSL2 (Ubuntu)　※コース B のみ", "Node.js 24（ビルド・テスト）", "Compact 0.36.0（変更時のみ）"], 14, bold=True)
textbox(s, Inches(0.8), Inches(5.25), Inches(8.0), Inches(1.5), [
    "・コース A（デモを動かすだけ）は、ブラウザと 1AM だけで動く",
    "・デモは状態の読み取りに公式 Indexer を使う（ウォレットの接続先に左右されない）",
    "・手数料の支払い・送信・ZK 証明はウォレット（1AM）に任せる",
], size=13)
rect(s, Inches(9.6), Inches(1.3), Inches(3.25), Inches(5.55), NAVY2, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.05)
textbox(s, Inches(9.8), Inches(1.45), Inches(3), Inches(5.3), [
    ("Midnight Preview", {"bold": True, "size": 17, "color": WHITE}),
    ("ledger 9（11/7 に再起動）", {"size": 12, "color": PALE, "after": 16}),
    ("Node（RPC）", {"bold": True, "size": 14, "color": WHITE}),
    ("rpc.preview.midnight.network", {"size": 11, "color": PALE, "after": 12}),
    ("Indexer", {"bold": True, "size": 14, "color": WHITE}),
    ("indexer.preview.midnight.network", {"size": 11, "color": PALE, "after": 12}),
    ("Faucet", {"bold": True, "size": 14, "color": WHITE}),
    ("faucet.preview.midnight.network", {"size": 11, "color": PALE, "after": 12}),
    ("GitHub Pages", {"bold": True, "size": 14, "color": WHITE}),
    ("デモ一式（HTML・JS・ZK 鍵）", {"size": 11, "color": PALE}),
])
arrow(s, Inches(9.15), Inches(3.9), Inches(0.42), Inches(0.4))

# 4. 2 つのコースと作業の流れ
s = new_slide("0.2 2 つのコースと作業の流れ", "全体像")
table(s, Inches(0.6), Inches(1.3), Inches(12.1), [
    ["コース", "目的", "必要な章", "目安"],
    ["A. デモを動かす", "公開中のデモ（GitHub Pages）を操作する", "1 → 2 → 3 → 4", "30〜60 分"],
    ["B. ローカルでビルド・開発", "ソースの変更、社内での配信、テストの実行", "A に加えて 5", "+1〜2 時間"],
], col_w=[2.6, 5.0, 2.6, 1.9], size=14, row_h=Inches(0.6))
steps = [("1", "事前確認|Preview確認", "10分"), ("2", "1AM|ウォレット", "15分"), ("3", "tNIGHT|DUST", "10〜30分"), ("4", "デモ|デプロイ", "10分"),
         ("5", "ローカル|環境(B)", "1〜2時間"), ("6", "動作|確認", "5分")]
for i, (n, name, t) in enumerate(steps):
    x = Inches(0.8) + i * Inches(2.05)
    c = rect(s, x, Inches(3.55), Inches(1.6), Inches(1.6), WARN_LINE if i in (2,) else (MUTED if i == 4 else BLUE), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    shape_text(c, [n] + name.split("|"), 22, WHITE, bold=True)
    for para in c.text_frame.paragraphs[1:]:
        for r in para.runs:
            r.font.size = Pt(13)
    if i < len(steps) - 1:
        arrow(s, x + Inches(1.65), Inches(4.2), Inches(0.33), Inches(0.3))
    textbox(s, x - Inches(0.1), Inches(5.25), Inches(1.8), Inches(0.4), [t], size=13, color=MUTED).text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
callout(s, Inches(0.6), Inches(5.95), Inches(12.1), Inches(0.9), "コース A では Docker・WSL・Node.js・Git は不要", [
    "3（オレンジ）は DUST がたまるのを待つ時間がかかります。5（グレー）はコース B のみです。"], kind="ok")

# 5. なぜこの構成なのか
s = new_slide("0.3 なぜこの構成なのか", "全体像")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["判断", "理由（構築時に実際に問題になった点）"],
    ["ウォレットは 1AM", "Lace は Preview の接続先（Blockfrost）が古いチェーンのまま止まっている。接続先は利用者も DApp も変更できない"],
    ["読み取りは公式 Indexer", "ウォレットの接続先が壊れていても、コントラクトの状態を読めるようにする"],
    ["バージョンを固定", "コンパイラ・ランタイム・SDK・Proof Server・ウォレットの組み合わせが厳密。公式の対応表（Support matrix）に合わせる"],
    ["ビルドは WSL2", "Compact コンパイラは Linux / macOS 版のみ。SDK は Node.js 22.12 以上"],
    ["デモはフォルダで配信", "ZK 証明鍵が約 108MB。HTML 1 枚に入れると GitHub の上限超え、JS だけ埋め込んでも起動しなかった"],
], col_w=[3.0, 9.1], size=14, row_h=Inches(0.75))

# 6. 用語
s = new_slide("0.4 用語", "全体像")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["用語", "意味"],
    ["Preview", "Midnight の公開テストネット。予告なくリセットされることがあり、tNIGHT・DUST・コントラクトがすべて消える"],
    ["ledger 8 / ledger 9", "台帳の版。2026-11 に 9 へ移行。版が違う SDK・コンパイラ・Proof Server は使えない"],
    ["tNIGHT", "Preview 用の NIGHT トークン。Faucet で無料でもらえる"],
    ["DUST", "手数料に使うリソース。NIGHT を「DUST 生成」に登録すると、時間とともにたまる。受け取っただけでは増えない"],
    ["Proof Server", "ゼロ知識証明を作るサーバー。1AM はウォレット側で証明を作るので、コース A では不要"],
    ["unshielded アドレス", "mn_addr_preview1…　Faucet の送り先"],
    ["口座鍵", "デモの中の登場人物（銀行・利用者 A・B）の秘密鍵。ウォレットの鍵とは別で、ブラウザに保存される"],
], col_w=[3.0, 9.1], size=14, row_h=Inches(0.63))

# 7. 事前確認
s = new_slide("1. 事前確認", "1. 事前確認")
textbox(s, Inches(0.6), Inches(1.3), Inches(5.6), Inches(3.2), [
    ("必要なもの", {"bold": True, "size": 18}),
    "・Chrome（または Edge）。拡張機能を追加できること",
    "・メモリ 16GB 以上推奨（ブラウザ内で証明を作る）",
    ("コース B のみ", {"bold": True, "size": 18}),
    "・Windows 11（WSL2）、管理者権限",
    "・ディスク空き 20GB 以上",
], size=15)
textbox(s, Inches(6.6), Inches(1.3), Inches(6.2), Inches(0.5), [("社内 TLS 検査（Netskope 等）の有無を確認", {"bold": True, "size": 18})])
code(s, Inches(6.6), Inches(1.9), Inches(6.2), Inches(1.3), [
    "Get-ChildItem Cert:\\LocalMachine\\Root |",
    "  Where-Object { $_.Subject -like '*netskope*' } |",
    "  Select-Object Subject",
], size=13)
table(s, Inches(6.6), Inches(3.4), Inches(6.2), [
    ["結果", "対応"],
    ["何か表示された", "TLS 検査あり（コース B の 5.6 で対処）"],
    ["何も表示されない", "TLS 検査なし"],
], col_w=[2.2, 4.0], size=13, row_h=Inches(0.5))
callout(s, Inches(0.6), Inches(5.3), Inches(12.1), Inches(1.4), "Windows の curl.exe は社内環境で失効確認に失敗することがある", [
    "CRYPT_E_NO_REVOCATION_CHECK が出たら --ssl-no-revoke を付ける。",
    "PowerShell で実行する前提。Git Bash から wsl を呼ぶ場合は MSYS_NO_PATHCONV=1 を付ける。"])

# 8. Preview の状態確認
s = new_slide("1.3 Preview の状態を確認する（毎回・作業の前に）", "1. 事前確認")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.6), ["Preview はリセットされることがあります（2026-11-07 に実際にリセット）。以前の tNIGHT・DUST・コントラクトが使えるかを先に確認します。"], size=16)
code(s, Inches(0.6), Inches(2.05), Inches(12.1), Inches(1.15), [
    "curl.exe -sS --ssl-no-revoke -H \"Content-Type: application/json\" `",
    "  -d '{\\\"query\\\":\\\"{ block { height timestamp } }\\\"}' https://indexer.preview.midnight.network/api/v4/graphql",
], size=13)
table(s, Inches(0.6), Inches(3.45), Inches(12.1), [
    ["結果", "意味・対応"],
    ["{\"data\":{\"block\":{\"height\":…}}} が返る", "Preview は動いている"],
    ["前回より height（ブロック高）が小さい", "リセットされた → tNIGHT・DUST を取り直す（3 章）、デモは「新しいコントラクトで最初から」（4.4）"],
    ["エラー・応答なし", "ネットワークか Preview の障害。公式ドキュメントで状況を確認"],
], col_w=[4.3, 7.8], size=14, row_h=Inches(0.62))
callout(s, Inches(0.6), Inches(6.15), Inches(12.1), Inches(0.7), "最新情報: https://docs.midnight.network/guides/networks-and-environments", [], kind="ok")

# 9. 1AM のインストールとウォレット
s = new_slide("2.1〜2.2 1AM のインストールとウォレットの用意", "2. 1AM")
textbox(s, Inches(0.6), Inches(1.3), Inches(6.0), Inches(4.4), [
    ("インストール", {"bold": True, "size": 18}),
    "・https://1am.xyz/ から Chrome の拡張機能を追加",
    "・拡張機能アイコン（パズル）から 1AM を固定しておく",
    ("A. 新しく作る（推奨）", {"bold": True, "size": 18}),
    "・リカバリーフレーズを紙に書き写して保管",
    "・確認の入力 → パスワードを決める",
    ("B. インポートする", {"bold": True, "size": 18}),
    "・リカバリーフレーズで復元 → 同期を待つ",
], size=15)
callout(s, Inches(6.9), Inches(1.4), Inches(5.8), Inches(2.0), "リカバリーフレーズの扱い", [
    "スクリーンショット・クラウドに保存しない",
    "口頭やチャットで伝えない",
    "デモ・検証専用のウォレットにする",
])
callout(s, Inches(6.9), Inches(3.7), Inches(5.8), Inches(2.0), "Lace は今の Preview で使えない", [
    "接続先（Blockfrost）がリセット前のチェーンのまま",
    "両方入っている場合、デモは 1AM を優先して接続する",
    "詳しくは付録「Lace について」",
])

# 10. Preview の確認とアドレス
s = new_slide("2.3〜2.4 Preview の確認とアドレス", "2. 1AM")
two_col_pic(s, [
    ("Preview を選ぶ", {"bold": True, "size": 18}),
    "・右上のアカウント（WA など）を押す",
    "・メニュー上部が PREVIEW か確認（違えば CHANGE）",
    "・右上に PREVIEW ● SYNCED と出れば同期済み",
    ("アドレス", {"bold": True, "size": 18}),
    "・unshielded（mn_addr_preview1…）: Faucet の送り先。RECEIVE で確認",
    "・shielded: 秘匿トークン用",
    "・DUST: デモの「ウォレット」画面にも表示",
    ("アカウントは 1 つで足りる", {"bold": True, "size": 18}),
    "・登場人物はデモの中の口座鍵で切り替える",
], "1am-menu-preview.png", size=14, left_w=5.2)

# 11. DUST のしくみ
s = new_slide("3. DUST のしくみ（ここが一番つまずく）", "3. tNIGHT / DUST")
flow = [("① Faucet", "tNIGHT を受け取る"), ("② GENERATE DUST", "NIGHT を DUST 生成に登録"), ("③ 待つ", "時間とともに DUST がたまる"), ("④ 操作", "DUST で手数料を払う")]
for i, (h, d) in enumerate(flow):
    x = Inches(0.6) + i * Inches(3.1)
    b = rect(s, x, Inches(1.6), Inches(2.7), Inches(1.6), LIGHT, BORDER, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    shape_text(b, [h, d], 18, bold=True)
    if i < 3:
        arrow(s, x + Inches(2.75), Inches(2.25), Inches(0.3), Inches(0.3))
callout(s, Inches(0.6), Inches(3.6), Inches(12.1), Inches(1.5), "DUST が 0 だと、デプロイを含むすべての操作が手数料不足で失敗する", [
    "tNIGHT を受け取っただけでは DUST は増えない。②の登録が別に必要で、登録後も少しずつたまる（構築時は約 0.04 DUST/秒）。",
])
callout(s, Inches(0.6), Inches(5.35), Inches(12.1), Inches(1.3), "初版の代替ツール（dust-install.cmd / dust-designate.cmd）は使えない", [
    "ledger 8 用（testkit-js 4.x）のまま。今は 1AM の画面から DUST を生成する（3.2）。",
])

# 12. tNIGHT を受け取る
s = new_slide("3.1 tNIGHT を受け取る", "3. tNIGHT / DUST")
two_col_pic(s, [
    "1. 1AM の RECEIVE で unshielded アドレスをコピー",
    "2. ブラウザで公式 Faucet を開く",
    ("　https://faucet.preview.midnight.network/", {"font": MONO, "size": 13}),
    "3. アドレスを貼り付けて請求",
    "4. 数分後、UNSHIELDED BALANCE が 5000.0 になり、TRANSACTIONS に Received +5000 NIGHT が出る",
    ("この時点では DUST は 0.0", {"bold": True, "size": 15, "color": WARN_LINE}),
    ("Faucet の API は「OK」でも届かないことがあった。ブラウザの画面から請求する", {"size": 13, "color": MUTED}),
], "1am-night-received.png", size=15, left_w=5.2)

# 13. DUST を生成する
s = new_slide("3.2 DUST を生成する（1AM の画面から）", "3. tNIGHT / DUST")
two_col_pic(s, [
    "1. ホームで YOUR DUST を押す",
    "2. DUST GENERATION の GENERATE DUST を押して承認",
    ("　DESIGNATED DUST ADDRESS は空欄でよい", {"size": 13, "color": MUTED}),
    "3. TRANSACTIONS に Self（+5000 / −5000 NIGHT）の行が出る",
    "4. Available Balance が増えていくのを確認",
    "5. 右上の DUST が 0 より大きくなれば準備完了",
    ("NIGHT UTXOS AVAILABLE: 0 → 登録済み。たまるのを待つ", {"size": 13, "color": MUTED}),
], "1am-your-dust.png", size=15, left_w=5.2)

# 14. デモを開いて接続
s = new_slide("4.1〜4.2 デモを開いてウォレットに接続する", "4. デモ")
textbox(s, Inches(0.6), Inches(1.3), Inches(5.4), Inches(1.6), [
    ("https://101nimura.github.io/midnight_td_demo/", {"bold": True, "size": 15, "font": MONO}),
    "・初回は JS・WASM（約 26MB）の読み込みに十数秒",
    "・失敗時は「デモの起動に失敗しました」が表示される",
    "・file:// で開く方法は使えない（#33）",
], size=14)
table(s, Inches(0.6), Inches(3.15), Inches(5.4), [
    ["S-2 の項目", "期待する表示"],
    ["ウォレットに接続", "接続済み（1AM / preview）"],
    ["DUST の確認", "OK（0 なら 3.2 へ）"],
    ["Proof Server", "1AM なら「停止中」でも可"],
    ["口座鍵", "作成済み"],
    ["コントラクト", "初回は「ログイン後に作成」"],
], col_w=[2.0, 3.4], size=13, row_h=Inches(0.55))
picture(s, IMG / "pactora-start.png", Inches(6.3), Inches(1.35), Inches(6.5), Inches(5.4))

# 15. デプロイ
s = new_slide("4.3 デプロイ（提供開始）を確認する", "4. デモ")
textbox(s, Inches(0.6), Inches(1.25), Inches(12.1), Inches(1.0), [
    "1. 小林 修（△△銀行）でログイン → ガイドのステップ 1 → 「提供を開始（デプロイ）」　2. 「承認して実行」→ 1AM の承認画面で承認",
    "3. 1〜数分で「預金トークンの提供を開始しました」、状態が「稼働中」になれば成功",
], size=14)
picture(s, IMG / "pactora-deploying.png", Inches(0.6), Inches(2.35), Inches(5.95), Inches(4.4))
picture(s, IMG / "pactora-deployed.png", Inches(6.75), Inches(2.35), Inches(5.95), Inches(4.4))

# 16. 結果の確認と 2 回目以降
s = new_slide("4.3〜4.4 結果の確認と、2 回目以降の使い方", "4. デモ")
textbox(s, Inches(0.6), Inches(1.3), Inches(5.6), Inches(1.7), [
    ("デプロイ後にすること", {"bold": True, "size": 17}),
    "・右上「ウォレット・口座鍵」→「口座鍵のエクスポート」で鍵を控える（銀行の鍵がないと、別の環境から銀行の操作ができない）",
    "・1AM の TRANSACTIONS に DApp … github.io（CONFIRMED）が出る",
], size=14)
table(s, Inches(0.6), Inches(3.4), Inches(5.6), [
    ["状況", "操作"],
    ["同じブラウザ・URL", "そのまま開く"],
    ["別のブラウザ・URL", "S-2 で口座鍵のインポートと既存アドレスの指定"],
    ["Preview がリセットされた", "「初期化」→「新しいコントラクトで最初から」"],
], col_w=[2.1, 3.5], size=13, row_h=Inches(0.65))
picture(s, IMG / "1am-transactions.png", Inches(6.5), Inches(1.35), Inches(6.3), Inches(5.4))

# 17. クローンと .cmd の実行場所
s = new_slide("5.1〜5.2 クローンと .cmd の実行場所（コース B）", "5. ローカル")
code(s, Inches(0.6), Inches(1.35), Inches(6.0), Inches(1.6), [
    "mkdir C:\\work -Force",
    "cd C:\\work",
    "git clone https://github.com/101nimura/midnight_td_demo.git",
    "cd midnight_td_demo",
], size=13)
textbox(s, Inches(0.6), Inches(3.1), Inches(6.0), Inches(3.5), [
    "・置き場所は空白・日本語なし、OneDrive 同期外（例: C:\\work）",
    "・コンパイル済みのコントラクト（ZK 鍵 約 108MB）を含む",
    "・含まれない: node_modules（npm-install.cmd）、dist-pactora（build-pactora.cmd）、certs（make-ca-bundle.cmd）",
    "・$'\\r': command not found → git rm --cached -r . → git reset --hard",
], size=14)
table(s, Inches(6.9), Inches(1.35), Inches(5.9), [
    ["実行する場所", "結果"],
    ["PowerShell: .\\build-pactora.cmd", "○"],
    ["エクスプローラーでダブルクリック", "○"],
    ["WSL の bash で .\\xxx.cmd", "✕ command not found（11/10 に発生）"],
    ["Git Bash で wsl …", "パスが書き換わる → MSYS_NO_PATHCONV=1"],
], col_w=[3.3, 2.6], size=13, row_h=Inches(0.62))
callout(s, Inches(6.9), Inches(4.75), Inches(5.9), Inches(1.6), ".cmd は Windows のバッチファイル", [
    "WSL の中で実行したい場合は、中身と同じコマンドを使う（例: bash .tools/npm.sh run build:pactora）。"])

# 18. WSL・Node・Compact
s = new_slide("5.3〜5.5 WSL2 / Node.js / Compact（コース B）", "5. ローカル")
code(s, Inches(0.6), Inches(1.35), Inches(6.0), Inches(1.0), [
    "# 管理者の PowerShell",
    "wsl --install -d Ubuntu      # 再起動 → wsl -l -v で VERSION 2",
], size=13)
code(s, Inches(0.6), Inches(2.55), Inches(6.0), Inches(1.6), [
    "# Ubuntu の中（wsl -d Ubuntu）",
    "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash",
    "source ~/.bashrc",
    "nvm install 24 && node -v    # v24.x（22.12 以上）",
], size=12)
code(s, Inches(0.6), Inches(4.35), Inches(6.0), Inches(1.5), [
    "# コントラクトを変更する場合のみ",
    "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh",
    "compact update 0.36.0        # ★固定",
], size=12)
callout(s, Inches(6.9), Inches(1.35), Inches(5.9), Inches(2.1), "Compact は 0.36.0 に固定", [
    "midnight-js 5.0.0 が受け付けるのはランタイム 0.21（0.36.0）と 0.16（0.31.1）だけ",
    "0.33〜0.35 の出力は EraMismatchError で拒否される",
])
callout(s, Inches(6.9), Inches(3.7), Inches(5.9), Inches(1.5), "Windows の compact.exe と混同しない", [
    "NTFS の圧縮ツールが同じ名前。Compact は必ず WSL の中で実行する",
])
callout(s, Inches(6.9), Inches(5.45), Inches(5.9), Inches(1.2), "コンパイル済みの鍵がリポジトリにある", [
    "変更しないなら Compact は不要（compile-contract.cmd も不要）",
], kind="ok")

# 19. Proof Server
s = new_slide("5.6 Rancher Desktop と Proof Server（必要な場合のみ）", "5. ローカル")
callout(s, Inches(0.6), Inches(1.3), Inches(12.1), Inches(1.05), "1AM を使うなら Proof Server は不要", [
    "11/10 のデプロイでは Proof Server に証明の依頼が届かなかった。ローカルで証明したい場合（VITE_PROOF_SERVER）だけ用意する。"], kind="ok")
textbox(s, Inches(0.6), Inches(2.6), Inches(6.0), Inches(3.9), [
    ("① Rancher Desktop", {"bold": True, "size": 17}),
    "・Container Engine は dockerd (moby)、Kubernetes は不要なら OFF",
    "・画面下部が「Running」になるまで待つ（その前は docker_engine エラー）",
    ("② CA バンドル（初回・全員）", {"bold": True, "size": 17}),
    "・社内 TLS 検査があると S3 からのパラメータ取得に失敗して停止する",
    "・.\\make-ca-bundle.cmd → certs\\ca-bundle.crt",
], size=14)
code(s, Inches(6.9), Inches(2.6), Inches(5.9), Inches(1.3), [
    "# ③ 起動（リポジトリのフォルダ）",
    "docker compose -f proof-server.yml up -d",
    "docker compose -f proof-server.yml logs -f",
], size=13)
textbox(s, Inches(6.9), Inches(4.05), Inches(5.9), Inches(2.6), [
    "・listening on: 0.0.0.0:6300 で起動完了",
    "・http://localhost:6300/version → 9.0.0",
    "・8.0.3 のままなら古いコンテナ。up -d で入れ替える",
    "・PC 再起動後は Running を待ってから up -d",
], size=14)

# 20. ビルド・起動
s = new_slide("5.7 依存パッケージ・テスト・ビルド・起動", "5. ローカル")
code(s, Inches(0.6), Inches(1.35), Inches(6.4), Inches(1.9), [
    ".\\npm-install.cmd     # 依存パッケージ（数分）",
    ".\\run-tests.cmd       # 9 passed",
    ".\\build-pactora.cmd   # dist-pactora\\ にビルド",
    ".\\start-pactora.cmd   # http://localhost:8081",
], size=14)
table(s, Inches(0.6), Inches(3.5), Inches(12.1), [
    ["方法", "URL", "用途"],
    ["start-pactora.cmd", "`http://localhost:8081/pactora-tdeposit-demo.html", "ビルドした版を手元・社内で配信"],
    ["start-dev.cmd", "`http://localhost:5173/pactora.html", "ソースを変更しながら確認（開発サーバー）"],
    ["GitHub Pages", "`https://101nimura.github.io/midnight_td_demo/", "main に push → Actions がビルドして公開"],
], col_w=[2.4, 5.5, 4.2], size=13, row_h=Inches(0.6))
callout(s, Inches(7.3), Inches(1.35), Inches(5.4), Inches(1.9), "dist-pactora はフォルダごと配信", [
    "HTML + assets\\（JS・WASM 約 26MB）+ keys\\ zkir\\ compiler\\（ZK 鍵 約 108MB）",
    "HTML だけコピーしても動かない",
])
callout(s, Inches(0.6), Inches(6.05), Inches(12.1), Inches(0.8), "URL ごとにブラウザの保存領域（口座鍵・コントラクト）は別になる（4.4）", [])

# 21. 動作確認
s = new_slide("6. 動作確認チェックリスト", "6. 確認")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["#", "コース", "確認項目", "期待する結果"],
    ["1", "A・B", "1.3 の Preview の確認", "height が返る（前回より小さければリセット済み）"],
    ["2", "A・B", "1AM の右上", "PREVIEW ● SYNCED"],
    ["3", "A・B", "1AM の DUST", "0 より大きい"],
    ["4", "A・B", "デモの S-2", "ウォレットが接続済み、DUST が OK"],
    ["5", "A・B", "デモのステップ 1（デプロイ）", "「提供を開始しました」、状態が稼働中"],
    ["6", "B", "run-tests.cmd", "9 passed"],
    ["7", "B", "build-pactora.cmd → start-pactora.cmd", "localhost:8081 に S-1 が表示される"],
    ["8", "B（使う場合）", "http://localhost:6300/version", "9.0.0"],
], col_w=[0.5, 1.6, 4.6, 5.4], size=14, row_h=Inches(0.56))
callout(s, Inches(0.6), Inches(6.5), Inches(12.1), Inches(0.5), "すべて OK なら README「3.3 Pactora UI 版」のガイドへ", [], kind="ok", size=12)

# 22-24. トラブルシューティング
t1 = [
    ["症状", "原因", "対処"],
    ["見つかりません。file:// で開いています", "file:// ではウォレットが組み込まれない（#33）", "GitHub Pages か localhost:8081 で開く"],
    ["見つかりません。window.midnight がありません", "拡張が無効 / サイトへのアクセス制限", "「すべてのサイト」にして再読み込み"],
    ["Lace で balanceUnsealedTransaction … Internal Server Error", "Lace の接続先（Blockfrost）が古いチェーン（#36）", "1AM を使う"],
    ["Lace にリセット前の残高が出る / Faucet の分が出ない", "同上。再同期しても直らない", "1AM を使う"],
    ["No account is connected for this dApp", "設定変更・ロックなどで接続が切れた", "もう一度操作 / 再読み込み"],
    ["以前のコントラクトが表示される・操作できない", "Preview がリセットされた（#35）", "初期化 →「新しいコントラクトで最初から」"],
]
t2 = [
    ["症状", "原因", "対処"],
    ["DUST がずっと 0", "未登録 / 登録直後", "3.2 の GENERATE DUST → 数分待つ"],
    ["dust-designate.cmd が使えない", "ledger 8 用のツール（#38）", "1AM の画面で DUST を生成"],
    ["Faucet が成功なのに着金しない", "アドレス違い / 同期前", "unshielded アドレスか確認、SYNCED を待つ"],
    ["「デモの起動に失敗しました」", "読み込み失敗 / 古いキャッシュ", "Ctrl+Shift+R、F12 で確認"],
    ["表示が古い（8.0.3 と出る など）", "キャッシュ / Pages の更新待ち", "数分待って Ctrl+Shift+R"],
    [".\\xxx.cmd: command not found", "WSL の bash で .cmd を実行", "PowerShell かエクスプローラーから"],
]
t3 = [
    ["症状", "原因", "対処"],
    ["C:/Program Files/Git/mnt/c/... No such file", "Git Bash のパス変換", "PowerShell / MSYS_NO_PATHCONV=1"],
    ["EraMismatchError / checkRuntimeVersion", "Compact のバージョン違い", "compact update 0.36.0 → 再コンパイル"],
    ["compact で圧縮ツールのような出力", "Windows の compact.exe", "WSL の中で実行"],
    ["//./pipe/docker_engine エラー", "Rancher Desktop 起動中", "Running まで待つ"],
    ["Proof Server がすぐ止まる", "社内 TLS 検査", "make-ca-bundle.cmd → 再起動"],
    ["localhost:6300/version が 8.0.3", "古いコンテナ", "docker compose … up -d で 9.0.0 に"],
]
for i, (rows, sub) in enumerate([(t1, "ウォレット・ネットワーク"), (t2, "DUST・デモ"), (t3, "ビルド・Proof Server")]):
    s = new_slide(f"7. トラブルシューティング（{i + 1}/3）{sub}", "7. トラブル")
    table(s, Inches(0.6), Inches(1.35), Inches(12.1), rows, col_w=[4.6, 3.8, 3.7], size=13, row_h=Inches(0.72))

# 25. 付録: Lace について
s = new_slide("付録. Lace について（2026-11-10 時点）", "付録")
two_col_pic(s, [
    "・Lace の Midnight 設定では、ノード RPC・インデクサーが Blockfrost に固定され、利用者は変更できない",
    "・Preview の再起動後も、Blockfrost のノードは古いチェーン（ブロック高 約 163 万）で止まり、インデクサーは 500 を返した",
    "・そのため Lace では、残高が古いまま・Faucet の分が見えない・デプロイが Internal Server Error になる",
    "・デモはウォレットの共通 API（DApp Connector）で接続するので、Lace の接続先が直れば Lace でも動く見込み",
    ("課題: ISSUES.md #34〜#36、TOKENIZED_DEPOSIT_ISSUES.md M2・M3", {"size": 13, "color": MUTED}),
], "lace-midnight-settings-blockfrost.png", size=14, left_w=6.0)

# 26. 付録: バージョンと接続先
s = new_slide("付録. バージョンと接続先（2026-11-10 に動作確認）", "付録")
table(s, Inches(0.6), Inches(1.35), Inches(5.9), [
    ["コンポーネント", "バージョン"],
    ["Preview", "ledger 9（11/7 再起動）"],
    ["ウォレット", "1AM（DApp Connector v4）"],
    ["Compact コンパイラ", "0.36.0"],
    ["compact-runtime", "0.21.0"],
    ["midnight-js", "5.0.0"],
    ["dapp-connector-api", "4.1.0"],
    ["ledger-v9", "1.0.0"],
    ["Proof Server", "9.0.0（必要な場合のみ）"],
    ["Node.js（WSL）", "24.x（22.12 以上）"],
], col_w=[2.7, 3.2], size=13, row_h=Inches(0.5))
table(s, Inches(6.8), Inches(1.35), Inches(5.9), [
    ["用途", "URL"],
    ["Indexer", "`https://indexer.preview.midnight.network/api/v4/graphql"],
    ["Node（RPC）", "`https://rpc.preview.midnight.network"],
    ["公式 Faucet", "`https://faucet.preview.midnight.network/"],
    ["デモ", "`https://101nimura.github.io/midnight_td_demo/"],
    ["リポジトリ", "`https://github.com/101nimura/midnight_td_demo"],
    ["公式ドキュメント", "`https://docs.midnight.network/guides/networks-and-environments"],
], col_w=[1.6, 4.3], size=11, row_h=Inches(0.55))
callout(s, Inches(6.8), Inches(5.4), Inches(5.9), Inches(1.3), "初版（11/2・ledger 8）の組み合わせは使えない", [
    "Compact 0.31.1 / midnight-js 4.1.1 / Proof Server 8.0.3 / Lace"])

prs.save(OUT)
print(f"saved {OUT} ({page['n']} slides)")
