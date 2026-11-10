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
textbox(s, Inches(0.8), Inches(2.65), Inches(11.5), Inches(0.8), ["Windows 11 × WSL2 × Rancher Desktop × 1AM（Preview ネットワーク・ledger 9）"], size=22, color=PALE)
textbox(s, Inches(0.8), Inches(3.9), Inches(11.5), Inches(2.2), [
    "対象: Midnight の DApp を開発する環境を、一から作る（特定のアプリに依存しない）",
    "範囲: WSL / Node.js / Compact / Proof Server / 1AM ウォレット / tNIGHT・DUST / 環境の確認",
    "所要時間: 約 2〜3 時間（ダウンロード・DUST がたまるのを待つ時間を含む）",
    "2026-11-10 改訂（Preview の再起動・ledger 9 対応）",
], size=16, color=WHITE)
textbox(s, Inches(0.8), Inches(6.6), Inches(11.5), Inches(0.5), ["詳細版: docs/SETUP.md　／　デモの動かし方: README.md"], size=12, color=RGBColor(0x8F, 0x9B, 0xB8))

# 2. この手順書について
s = new_slide("この手順書について", "はじめに")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.6), ["Windows 11 で、Midnight（Preview）の DApp を開発する環境を一から作る手順です。順番どおりに進めてください。"], size=17)
pts = [
    ("2026-11-10 に動作確認", "手順・バージョンはこの日に確認した組み合わせ（付録 A）"),
    ("毎回、Preview を確認", "テストネットはリセット・更新される。作業前に 1.5 で状態を確認"),
    ("バージョンを固定", "Compact 0.36.0 / midnight-js 5.0.0 / Proof Server 9.0.0"),
    ("Docker は「Running」を待つ", "起動しきる前の操作は docker_engine エラーになる"),
    ("DUST は自動では増えない", "登録が必要で、時間とともにたまる。0 だと全操作が失敗"),
    ("画面は版で変わる", "ウォレット等のボタン名が違う場合は、近いものを探す"),
]
for i, (h, d) in enumerate(pts):
    col, row = i % 3, i // 3
    x = Inches(0.6) + col * Inches(4.1)
    y = Inches(2.15) + row * Inches(2.35)
    rect(s, x, y, Inches(3.85), Inches(2.1), LIGHT, BORDER, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
    rect(s, x, y, Inches(3.85), Inches(0.09), BLUE)
    textbox(s, x + Inches(0.2), y + Inches(0.25), Inches(3.5), Inches(1.8), [(h, {"bold": True, "size": 18}), (d, {"size": 14, "color": MUTED})])

# 3. 全体構成
s = new_slide("0.1 全体構成", "全体像")
rect(s, Inches(0.5), Inches(1.3), Inches(8.6), Inches(5.55), LIGHT, RGBColor(0xC8, 0xCE, 0xDB), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.03)
textbox(s, Inches(0.7), Inches(1.38), Inches(4), Inches(0.4), [("Windows 11", {"bold": True, "size": 15})])
rect(s, Inches(0.8), Inches(1.85), Inches(8.0), Inches(1.45), WHITE, BLUE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
textbox(s, Inches(0.95), Inches(1.9), Inches(3), Inches(0.4), [("Chrome / Edge", {"bold": True, "size": 13, "color": BLUE})])
a1 = rect(s, Inches(1.0), Inches(2.3), Inches(3.6), Inches(0.85), RGBColor(0xE8, 0xEE, 0xFF), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
shape_text(a1, ["開発中の DApp", "開発サーバー localhost:5173 など"], 14, bold=True)
a2 = rect(s, Inches(5.0), Inches(2.3), Inches(3.6), Inches(0.85), RGBColor(0xF0, 0xE8, 0xFF), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1)
shape_text(a2, ["1AM ウォレット拡張", "手数料(DUST)・署名・ZK 証明"], 14, bold=True)
rd = rect(s, Inches(0.8), Inches(3.5), Inches(3.9), Inches(1.5), WHITE, RGBColor(0x2F, 0xBF, 0x71), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
shape_text(rd, ["Rancher Desktop（Docker）", "Proof Server 9.0.0  :6300", "ZK 証明を生成"], 14, bold=True)
wsl = rect(s, Inches(4.9), Inches(3.5), Inches(3.9), Inches(1.5), WHITE, WARN_LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
shape_text(wsl, ["WSL2 (Ubuntu)", "Node.js 24（nvm）", "Compact 0.36.0"], 14, bold=True)
textbox(s, Inches(0.8), Inches(5.25), Inches(8.0), Inches(1.5), [
    "・WSL でコンパイル・ビルド・テスト、開発サーバーを起動",
    "・ZK 証明はウォレット（1AM）でも、ローカルの Proof Server でも作れる",
    "・DApp → Midnight Preview（公式 Indexer / Node）へ接続",
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
    ("S3（パラメータ）", {"bold": True, "size": 14, "color": WHITE}),
    ("Proof Server が起動時に取得", {"size": 11, "color": PALE}),
])
arrow(s, Inches(9.15), Inches(3.9), Inches(0.42), Inches(0.4))

# 4. なぜこの構成なのか
s = new_slide("0.2 なぜこの構成なのか", "全体像")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["判断", "理由"],
    ["ビルドを WSL2 で行う", "Compact コンパイラは Linux / macOS 版のみ。SDK は Node.js 22.12 以上が必要"],
    ["Docker は Rancher Desktop", "Proof Server は Docker イメージで提供（Docker Desktop でも可）"],
    ["バージョンを固定", "コンパイラ・ランタイム・SDK・Proof Server・ウォレットの組み合わせが厳密。公式の対応表（Support matrix）に合わせる"],
    ["ウォレットは 1AM", "Lace は Preview の接続先（Blockfrost）が古いチェーンのまま止まっている。接続先は利用者も DApp も変更できない"],
    ["読み取りは公式 Indexer（推奨）", "ウォレットの接続先に障害があっても、コントラクトの状態を読めるようにする"],
], col_w=[3.2, 8.9], size=14, row_h=Inches(0.75))

# 5. 用語
s = new_slide("0.3 用語", "全体像")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["用語", "意味"],
    ["Preview", "Midnight の公開テストネット。予告なくリセットされることがあり、tNIGHT・DUST・コントラクトがすべて消える"],
    ["ledger 8 / ledger 9", "台帳の版。2026-11 に 9 へ移行。版が違う SDK・コンパイラ・Proof Server は使えない"],
    ["tNIGHT", "Preview 用の NIGHT トークン。Faucet で無料でもらえる"],
    ["DUST", "手数料に使うリソース。NIGHT を「DUST 生成」に登録すると、時間とともにたまる。受け取っただけでは増えない"],
    ["Proof Server", "トランザクションのゼロ知識証明を作るサーバー。手元の Docker で動かす"],
    ["unshielded アドレス", "mn_addr_preview1…　Faucet の送り先"],
    ["DUST アドレス", "mn_dust_preview1…　DUST の受け取り先"],
], col_w=[3.0, 9.1], size=14, row_h=Inches(0.63))

# 6. 作業の流れ
s = new_slide("0.4 作業の流れ", "全体像")
steps = [("1", "事前確認|Git・クローン", "20分"), ("2", "WSL2", "20分"), ("3", "Node.js", "10分"), ("4", "Compact", "10分"),
         ("5", "Docker|Proof|Server", "30分"), ("6", "1AM", "15分"), ("7", "tNIGHT|DUST", "10〜30分"), ("8", "環境の|確認", "20分")]
for i, (n, name, t) in enumerate(steps):
    x = Inches(0.5) + i * Inches(1.58)
    c = rect(s, x, Inches(2.0), Inches(1.25), Inches(1.9), WARN_LINE if i in (4, 6) else BLUE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    shape_text(c, [n] + name.split("|"), 22, WHITE, bold=True)
    for para in c.text_frame.paragraphs[1:]:
        for r in para.runs:
            r.font.size = Pt(13)
    if i < len(steps) - 1:
        arrow(s, x + Inches(1.28), Inches(2.82), Inches(0.27), Inches(0.26))
    textbox(s, x - Inches(0.1), Inches(4.05), Inches(1.45), Inches(0.4), [t], size=13, color=MUTED).text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
callout(s, Inches(0.6), Inches(4.9), Inches(12.1), Inches(1.6), "時間がかかる・つまずきやすい工程（オレンジ）", [
    "5: Rancher Desktop の起動待ち、イメージとパラメータのダウンロード、社内 TLS 検査への対処",
    "7: Faucet の着金待ち、DUST の生成（登録後、時間とともにたまる）",
])

# 7. 事前確認
s = new_slide("1.1〜1.2 事前確認", "1. 事前確認")
textbox(s, Inches(0.6), Inches(1.3), Inches(5.6), Inches(3.2), [
    ("必要なもの", {"bold": True, "size": 18}),
    "・Windows 11（WSL2 が使えること）",
    "・管理者権限（WSL・Rancher Desktop の導入）",
    "・メモリ 16GB 以上推奨 / ディスク空き 20GB 以上",
    "・Chrome または Edge（拡張機能を追加できること）",
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
], col_w=[2.2, 4.0], size=13, row_h=Inches(0.5))
callout(s, Inches(0.6), Inches(5.3), Inches(12.1), Inches(1.2), "Windows の curl.exe は社内環境で失効確認に失敗することがある", [
    "CRYPT_E_NO_REVOCATION_CHECK が出たら --ssl-no-revoke を付ける。"])

# 8. コマンドの実行場所と Git
s = new_slide("1.3〜1.4 コマンドを実行する場所 / Git とクローン", "1. 事前確認")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["実行する場所", "注意点"],
    ["PowerShell", "基本はここ。*.cmd（Windows のバッチファイル）は .\\xxx.cmd で実行する"],
    ["WSL の bash（user@PC:/mnt/c/...$）", "$ で始まる行はここ。*.cmd はここでは動かない（.\\xxx.cmd: command not found になる）"],
    ["Git Bash", "wsl を呼ぶとパスが書き換えられて失敗する → 先頭に MSYS_NO_PATHCONV=1"],
], col_w=[3.8, 8.3], size=14, row_h=Inches(0.75))
textbox(s, Inches(0.6), Inches(4.5), Inches(6.0), Inches(2.3), [
    ("Git とリポジトリのクローン", {"bold": True, "size": 18}),
    "・git --version で表示されなければ https://git-scm.com/download/win",
    "・Proof Server の設定・確認用スクリプトがあるので先にクローン",
    "・置き場所は空白・日本語なし、OneDrive 同期外（例: C:\\work）",
], size=14)
code(s, Inches(6.9), Inches(4.55), Inches(5.9), Inches(1.6), [
    "mkdir C:\\work -Force",
    "cd C:\\work",
    "git clone https://github.com/101nimura/midnight_td_demo.git",
    "cd midnight_td_demo     # 以降「リポジトリのフォルダ」",
], size=12)

# 9. Preview の状態確認
s = new_slide("1.5 Preview の状態を確認する（毎回・作業の前に）", "1. 事前確認")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.6), ["Preview はリセットされることがあります（例: 2026-11-07 に ledger 9 で再起動）。以前の tNIGHT・DUST・コントラクトが使えるかを先に確認します。"], size=16)
code(s, Inches(0.6), Inches(2.05), Inches(12.1), Inches(1.15), [
    "(Invoke-RestMethod -Method Post -Uri 'https://indexer.preview.midnight.network/api/v4/graphql' `",
    "  -ContentType 'application/json' -Body '{\"query\":\"{ block { height timestamp } }\"}').data.block",
], size=13)
table(s, Inches(0.6), Inches(3.45), Inches(12.1), [
    ["結果", "意味・対応"],
    ["height と timestamp が表示される", "Preview は動いている（height を控えておく）"],
    ["前回より height（ブロック高）が小さい", "リセットされた → tNIGHT・DUST を取り直し（7 章）、コントラクトはデプロイし直す"],
    ["ledger の版が上がっている", "付録 A のバージョン一式を、公式の対応表に合わせて更新する"],
], col_w=[4.3, 7.8], size=14, row_h=Inches(0.62))
callout(s, Inches(0.6), Inches(6.15), Inches(12.1), Inches(0.7), "最新情報・対応表: https://docs.midnight.network/guides/networks-and-environments", [], kind="ok")

# 10. WSL2 と Node.js
s = new_slide("2〜3. WSL2 と Node.js", "2〜3. WSL / Node")
code(s, Inches(0.6), Inches(1.35), Inches(6.0), Inches(1.3), [
    "# 管理者の PowerShell",
    "wsl --install -d Ubuntu      # 再起動を求められたら再起動",
    "wsl -l -v                    # Ubuntu が VERSION 2",
], size=13)
code(s, Inches(0.6), Inches(2.9), Inches(6.0), Inches(1.75), [
    "# Ubuntu の中（wsl -d Ubuntu）",
    "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash",
    "source ~/.bashrc",
    "nvm install 24",
    "node -v                      # v24.x（22.12 以上が必要）",
], size=12)
callout(s, Inches(6.9), Inches(1.35), Inches(5.9), Inches(1.6), "Windows 側の Node.js は使わない", [
    "古いままでも問題ない。WSL に引き継がれる Windows の PATH の影響を避けるため、スクリプトは .tools/env.sh で PATH を設定し直す"], kind="ok")
callout(s, Inches(6.9), Inches(3.2), Inches(5.9), Inches(1.6), "ディストリビューション名が Ubuntu 以外の場合", [
    "環境変数 WSL_DISTRO にその名前を設定し、PowerShell を開き直す"])

# 11. Compact
s = new_slide("4. Compact コンパイラ（WSL 内）", "4. Compact")
code(s, Inches(0.6), Inches(1.35), Inches(12.1), Inches(1.5), [
    "curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh",
    "source ~/.bashrc",
    "compact update 0.36.0        # ★必ず対応表のバージョンに固定する",
    "compact compile --version    # 0.36.0",
], size=13)
callout(s, Inches(0.6), Inches(3.15), Inches(5.9), Inches(2.3), "バージョンは対応表に合わせる", [
    "midnight-js 5.0.0 が受け付けるのはランタイム 0.21（コンパイラ 0.36.0）と 0.16（0.31.1、ledger 8 の既存コントラクト用）だけ",
    "0.33〜0.35 の出力は EraMismatchError で拒否される",
])
callout(s, Inches(6.8), Inches(3.15), Inches(5.9), Inches(2.3), "Windows の compact.exe と混同しない", [
    "NTFS の圧縮ツール C:\\Windows\\System32\\compact.exe が同じ名前",
    "Compact コンパイラは必ず WSL の中で実行する",
])
callout(s, Inches(0.6), Inches(5.7), Inches(12.1), Inches(0.9), "複数の版を入れて切り替えられる", ["compact list --installed で一覧、compact update <版> で既定を切り替え"], kind="ok")

# 12. Rancher Desktop と CA バンドル
s = new_slide("5.1〜5.2 Rancher Desktop と CA バンドル", "5. Docker")
textbox(s, Inches(0.6), Inches(1.3), Inches(6.0), Inches(3.4), [
    ("Rancher Desktop", {"bold": True, "size": 18}),
    "1. https://rancherdesktop.io/ から Windows 版を導入（管理者権限）",
    "2. Container Engine は dockerd (moby)（containerd だと docker が使えない）",
    "3. Kubernetes は不要なら OFF",
    "4. 画面下部が「Running」になるまで待つ",
    "5. docker info で Server Version が出れば OK",
], size=15)
callout(s, Inches(0.6), Inches(4.9), Inches(6.0), Inches(1.5), "Running の前に docker を使うとエラー", ["error during connect: ... //./pipe/docker_engine ...", "故障ではない。待ってからやり直す"])
textbox(s, Inches(6.9), Inches(1.3), Inches(5.9), Inches(1.3), [
    ("CA バンドルを作る（全員）", {"bold": True, "size": 18}),
    "Proof Server は起動時に S3 からパラメータを取得。社内 TLS 検査があると失敗して停止する",
], size=14)
code(s, Inches(6.9), Inches(2.75), Inches(5.9), Inches(0.75), [".\\make-ca-bundle.cmd      # → certs\\ca-bundle.crt"], size=13)
textbox(s, Inches(6.9), Inches(3.7), Inches(5.9), Inches(2.8), [
    "・proof-server.yml が必ず読み込むので、TLS 検査がなくても作る",
    "・Netskope 以外は .tools\\make-ca-bundle.ps1 -Pattern '*zscaler*'",
    "・リポジトリのフォルダ（1.4）で実行する",
], size=14)

# 13. Proof Server の起動
s = new_slide("5.3 Proof Server の起動と確認", "5. Docker")
code(s, Inches(0.6), Inches(1.35), Inches(7.0), Inches(1.1), [
    "docker compose -f proof-server.yml up -d",
    "docker compose -f proof-server.yml logs -f     # Ctrl+C で抜ける",
], size=14)
textbox(s, Inches(0.6), Inches(2.7), Inches(7.0), Inches(3.0), [
    "・イメージ midnightntwrk/proof-server:9.0.0、ポート 6300",
    "・初回（または版の変更後）はダウンロードで数分",
    "・ログに listening on: 0.0.0.0:6300 で起動完了",
    "・http://localhost:6300/version → 9.0.0",
    "・8.0.3 と出たら古いコンテナ。up -d で入れ替える",
    "・PC 再起動後は Running を待ってから up -d",
], size=15)
callout(s, Inches(7.9), Inches(1.35), Inches(4.9), Inches(2.6), "Proof Server の使いどころ", [
    "ブラウザの DApp から 1AM を使う場合、証明はウォレット側で作られる（Proof Server なしで動作。2026-11-10 に確認）",
    "CLI・テストの自動化・ローカルで証明したい場合（httpClientProofProvider）に使う",
], kind="ok")

# 14. 1AM のインストールとウォレット
s = new_slide("6.1〜6.2 1AM のインストールとウォレットの用意", "6. 1AM")
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
    "開発・検証専用のウォレットにする",
])
callout(s, Inches(6.9), Inches(3.7), Inches(5.8), Inches(2.0), "Lace は今の Preview で使えない", [
    "接続先（Blockfrost）がリセット前のチェーンのまま",
    "接続先は利用者も DApp も変更できない",
    "詳しくは付録「Lace について」",
])

# 15. Preview の確認とアドレス
s = new_slide("6.3〜6.4 Preview の確認とアドレス", "6. 1AM")
two_col_pic(s, [
    ("Preview を選ぶ", {"bold": True, "size": 18}),
    "・右上のアカウント（WA など）を押す",
    "・メニュー上部が PREVIEW か確認（違えば CHANGE）",
    "・右上に PREVIEW ● SYNCED と出れば同期済み",
    ("アドレス", {"bold": True, "size": 18}),
    "・unshielded（mn_addr_preview1…）: Faucet の送り先。RECEIVE で確認",
    "・shielded: 秘匿トークン用",
    "・DUST（mn_dust_preview1…）: DApp から getDustAddress() で取得できる",
], "1am-menu-preview.png", size=14, left_w=5.2)

# 16. DUST のしくみ
s = new_slide("7. DUST のしくみ（ここが一番つまずく）", "7. tNIGHT / DUST")
flow = [("① Faucet", "tNIGHT を受け取る"), ("② GENERATE DUST", "NIGHT を DUST 生成に登録"), ("③ 待つ", "時間とともに DUST がたまる"), ("④ 操作", "DUST で手数料を払う")]
for i, (h, d) in enumerate(flow):
    x = Inches(0.6) + i * Inches(3.1)
    b = rect(s, x, Inches(1.6), Inches(2.7), Inches(1.6), LIGHT, BORDER, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    shape_text(b, [h, d], 18, bold=True)
    if i < 3:
        arrow(s, x + Inches(2.75), Inches(2.25), Inches(0.3), Inches(0.3))
callout(s, Inches(0.6), Inches(3.6), Inches(12.1), Inches(1.5), "DUST が 0 だと、デプロイを含むすべての操作が手数料不足で失敗する", [
    "tNIGHT を受け取っただけでは DUST は増えない。②の登録が別に必要で、登録後も少しずつたまる（目安: 約 0.04 DUST/秒）。",
])
callout(s, Inches(0.6), Inches(5.35), Inches(12.1), Inches(1.3), "リポジトリの dust-install.cmd / dust-designate.cmd は使えない", [
    "旧版（ledger 8）用の代替ツール。1AM の画面から DUST を生成する（7.2）。",
])

# 17. tNIGHT を受け取る
s = new_slide("7.1 tNIGHT を受け取る", "7. tNIGHT / DUST")
two_col_pic(s, [
    "1. 1AM の RECEIVE で unshielded アドレスをコピー",
    "2. ブラウザで公式 Faucet を開く",
    ("　https://faucet.preview.midnight.network/", {"font": MONO, "size": 13}),
    "3. アドレスを貼り付けて請求",
    "4. 数分後、UNSHIELDED BALANCE が 5000.0 になり、TRANSACTIONS に Received +5000 NIGHT が出る",
    ("この時点では DUST は 0.0", {"bold": True, "size": 15, "color": WARN_LINE}),
    ("Faucet の API は「OK」でも届かないことがあった。ブラウザの画面から請求する", {"size": 13, "color": MUTED}),
], "1am-night-received.png", size=15, left_w=5.2)

# 18. DUST を生成する
s = new_slide("7.2 DUST を生成する（1AM の画面から）", "7. tNIGHT / DUST")
two_col_pic(s, [
    "1. ホームで YOUR DUST を押す",
    "2. DUST GENERATION の GENERATE DUST を押して承認",
    ("　DESIGNATED DUST ADDRESS は空欄でよい（入れるとそのアドレスに DUST がたまる）", {"size": 13, "color": MUTED}),
    "3. TRANSACTIONS に Self（+5000 / −5000 NIGHT）の行が出る",
    "4. Available Balance が増えていくのを確認",
    "5. 右上の DUST が 0 より大きくなれば準備完了",
    ("NIGHT UTXOS AVAILABLE: 0 → 登録済み。たまるのを待つ", {"size": 13, "color": MUTED}),
], "1am-your-dust.png", size=15, left_w=5.2)

# 19. コンパイル・テスト・ビルド
s = new_slide("8.1 環境の確認（コンパイル・テスト・ビルド）", "8. 確認")
textbox(s, Inches(0.6), Inches(1.3), Inches(12), Inches(0.6), ["ここまでの環境で、リポジトリ（1.4 でクローン）のコンパイル・テスト・ビルドが通るかを確認します。PowerShell で、リポジトリのフォルダで実行します。"], size=15)
code(s, Inches(0.6), Inches(2.1), Inches(6.4), Inches(1.9), [
    ".\\npm-install.cmd        # 依存パッケージ（数分）",
    ".\\compile-contract.cmd   # コンパイラの確認（数分）",
    ".\\run-tests.cmd          # 9 passed",
    ".\\build-pactora.cmd      # SDK・Vite の確認",
], size=14)
callout(s, Inches(7.3), Inches(2.1), Inches(5.5), Inches(1.9), "compile-contract.cmd は成果物を作り直す", [
    "確認だけなら git checkout -- contract/managed で戻す",
    "compiler/contract-manifest.json の compiler-version が 0.36.0 なら OK",
])

# 20. 接続の確認とチェックリスト
s = new_slide("8.2〜8.3 ウォレット接続の確認とチェックリスト", "8. 確認")
code(s, Inches(0.6), Inches(1.35), Inches(4.4), Inches(0.75), [".\\start-dev.cmd   # 開発サーバー"], size=13)
textbox(s, Inches(0.6), Inches(2.25), Inches(4.4), Inches(3.5), [
    "・http://localhost:5173/pactora.html を開く",
    "・「業務 01 を始める」→「ウォレットに接続」→ 1AM で承認",
    "・S-2 でウォレットが「接続済み」、DUST が「OK」なら DApp からウォレットを使えている",
    ("以降のデモの操作は README を参照", {"size": 13, "color": MUTED}),
], size=14)
table(s, Inches(5.3), Inches(1.35), Inches(7.5), [
    ["#", "確認項目", "期待する結果"],
    ["1", "1.5 の Preview の確認", "height が返る"],
    ["2", "node -v（WSL）", "v24.x"],
    ["3", "compact compile --version", "0.36.0"],
    ["4", "docker info", "エラーが出ない"],
    ["5", "localhost:6300/version", "9.0.0"],
    ["6", "1AM の右上", "PREVIEW ● SYNCED、DUST > 0"],
    ["7", "run-tests.cmd", "9 passed"],
    ["8", "build-pactora.cmd", "エラーなく終わる"],
    ["9", "開発サーバーでウォレットに接続", "接続済み、DUST が OK"],
], col_w=[0.4, 3.6, 3.5], size=12, row_h=Inches(0.5))

# 21-23. トラブルシューティング
t1 = [
    ["症状", "原因", "対処"],
    [".\\xxx.cmd: command not found", "WSL の bash で .cmd を実行", "PowerShell かエクスプローラーから（1.3）"],
    ["C:/Program Files/Git/mnt/c/... No such file", "Git Bash のパス変換", "PowerShell / MSYS_NO_PATHCONV=1"],
    ["compact で圧縮ツールのような出力", "Windows の compact.exe", "WSL の中で実行"],
    ["EraMismatchError / checkRuntimeVersion", "Compact のバージョン違い", "compact update 0.36.0 → 再コンパイル"],
    ["$'\\r': command not found", "改行 CRLF でクローン", "git rm --cached -r . → git reset --hard"],
    ["expected instance of … / instanceof 失敗", "WASM パッケージの二重読み込み", "overrides で固定 + resolve.dedupe（付録 C）"],
]
t2 = [
    ["症状", "原因", "対処"],
    ["//./pipe/docker_engine エラー", "Rancher Desktop 起動中", "Running まで待つ"],
    ["Proof Server がすぐ止まる", "社内 TLS 検査", "make-ca-bundle.cmd → 再起動"],
    ["localhost:6300/version が 8.0.3", "古いコンテナ", "docker compose … up -d で 9.0.0 に"],
    ["DUST がずっと 0", "未登録 / 登録直後", "7.2 の GENERATE DUST → 数分待つ"],
    ["dust-designate.cmd が使えない", "旧版（ledger 8）用のツール", "1AM の画面で DUST を生成"],
    ["Faucet が成功なのに着金しない", "アドレス違い / 同期前", "unshielded アドレスか確認、SYNCED を待つ"],
]
t3 = [
    ["症状", "原因", "対処"],
    ["ウォレットが見つかりません（file://）", "file:// ではウォレットが組み込まれない", "http で開く"],
    ["… window.midnight がありません", "拡張が無効 / サイトへのアクセス制限", "「すべてのサイト」にして再読み込み"],
    ["Lace で balanceUnsealedTransaction … Internal Server Error", "Lace の接続先（Blockfrost）が古いチェーン（2026-11-10 時点）", "1AM を使う"],
    ["Lace にリセット前の残高が出る / Faucet の分が出ない", "同上。再同期しても直らない", "1AM を使う"],
    ["No account is connected for this dApp", "設定変更・ロックなどで接続が切れた", "DApp から接続し直す"],
    ["以前の残高・コントラクトが見つからない", "Preview がリセットされた", "1.5 で確認 → 取り直し・デプロイし直し"],
]
for i, (rows, sub) in enumerate([(t1, "ツール・ビルド"), (t2, "Docker・DUST"), (t3, "ウォレット・ネットワーク")]):
    s = new_slide(f"9. トラブルシューティング（{i + 1}/3）{sub}", "9. トラブル")
    table(s, Inches(0.6), Inches(1.35), Inches(12.1), rows, col_w=[4.6, 3.8, 3.7], size=13, row_h=Inches(0.72))

# 24. 付録: バージョンと接続先
s = new_slide("付録 A・B. バージョンと接続先（2026-11-10 に動作確認）", "付録")
table(s, Inches(0.6), Inches(1.35), Inches(5.9), [
    ["コンポーネント", "バージョン"],
    ["Preview", "ledger 9（11/7 再起動）"],
    ["ウォレット", "1AM（DApp Connector v4）"],
    ["Compact コンパイラ", "0.36.0"],
    ["compact-runtime", "0.21.0"],
    ["midnight-js", "5.0.0"],
    ["dapp-connector-api", "4.1.0"],
    ["ledger-v9", "1.0.0"],
    ["Proof Server", "9.0.0"],
    ["Node.js（WSL）", "24.x（22.12 以上）"],
], col_w=[2.7, 3.2], size=13, row_h=Inches(0.5))
table(s, Inches(6.8), Inches(1.35), Inches(5.9), [
    ["用途", "URL"],
    ["Indexer", "`https://indexer.preview.midnight.network/api/v4/graphql"],
    ["Node（RPC）", "`https://rpc.preview.midnight.network"],
    ["公式 Faucet", "`https://faucet.preview.midnight.network/"],
    ["Proof Server", "`http://localhost:6300"],
    ["リポジトリ", "`https://github.com/101nimura/midnight_td_demo"],
    ["公式ドキュメント", "`https://docs.midnight.network/guides/networks-and-environments"],
], col_w=[1.6, 4.3], size=11, row_h=Inches(0.55))
callout(s, Inches(6.8), Inches(5.4), Inches(5.9), Inches(1.3), "旧版（ledger 8）の組み合わせは使えない", [
    "Compact 0.31.1 / midnight-js 4.1.1 / Proof Server 8.0.3 / Lace"])

# 25. 付録: Lace について
s = new_slide("付録 B. Lace について（2026-11-10 時点）", "付録")
two_col_pic(s, [
    "・Lace の Midnight 設定では、ノード RPC・インデクサーが Blockfrost に固定され、利用者は変更できない",
    "・Preview の再起動後も、Blockfrost のノードは古いチェーン（ブロック高 約 163 万）で止まり、インデクサーは 500 を返した",
    "・そのため Lace では、残高が古いまま・Faucet の分が見えない・トランザクションが Internal Server Error になる",
    "・DApp Connector API は共通なので、Lace の接続先が直れば同じ DApp が Lace でも動く見込み",
    ("Preview の公式の接続先はトークン不要。Mainnet・Preprod の Midnight 運営の接続先は 10/9 に廃止され Blockfrost へ", {"size": 13, "color": MUTED}),
], "lace-midnight-settings-blockfrost.png", size=14, left_w=6.0)

# 26. 付録 C: 開発時の注意
s = new_slide("付録 C. DApp を開発するときの注意（midnight-js 5.0.0）", "付録")
table(s, Inches(0.6), Inches(1.35), Inches(12.1), [
    ["項目", "内容"],
    ["パッケージのスコープ", "ledger・DApp Connector API などは @midnightntwrk/*（ハイフンなし）、midnight-js・compact-runtime は @midnight-ntwrk/*"],
    ["WASM パッケージの固定", "package.json の overrides で ledger-v9・onchain-runtime-v4・platform-js を 1 つの版に。Vite では resolve.dedupe"],
    ["ネットワーク ID", "setNetworkId は廃止。プロバイダに config: { networkId: 'preview', ttlSeconds: 3600 } を渡す"],
    ["ウォレット接続", "midnight-js-dapp-connector-proof-provider の dappConnectorWalletProviders / dappConnectorProofProvider"],
    ["チェーンの状態", "バイト列 + era で届く。自分の runtime で復号（deserialize({ v9: ContractState })）"],
    ["ZK 鍵の配信", "keys/・zkir/ に加えて compiler/（マニフェスト）も配信。ledger 9 の証明鍵は 1 回路 約 11MB"],
], col_w=[2.8, 9.3], size=13, row_h=Inches(0.72))
callout(s, Inches(0.6), Inches(6.55), Inches(12.1), Inches(0.45), "詳細: midnight-js の docs/releases/v5.0.0/migration-guide.md", [], kind="ok", size=12)

prs.save(OUT)
print(f"saved {OUT} ({page['n']} slides)")
