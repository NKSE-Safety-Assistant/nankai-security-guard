from pathlib import Path
import re

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "南开校园安全卫士使用手册.md"
OUT_PATH = ROOT / "南开校园安全卫士使用手册.docx"


def set_run_font(run, size=None, bold=None, color=None):
    run.font.name = "Microsoft YaHei"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def set_para_spacing(paragraph, before=0, after=6, line=1.2):
    paragraph.paragraph_format.space_before = Pt(before)
    paragraph.paragraph_format.space_after = Pt(after)
    paragraph.paragraph_format.line_spacing = line


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def add_bottom_border(paragraph, color="2E74B5", size="8"):
    p = paragraph._p
    p_pr = p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), "6")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)


def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, before=2, after=10, line=1.1)
    r = p.add_run(text)
    set_run_font(r, size=9, color="666666")


def add_callout(doc, text):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    table.columns[0].width = Inches(6.2)
    cell = table.cell(0, 0)
    shade_cell(cell, "F4F7FB")
    cell.text = ""
    p = cell.paragraphs[0]
    set_para_spacing(p, before=4, after=4, line=1.2)
    r = p.add_run(text)
    set_run_font(r, size=10, color="2F3A4A")


def add_image(doc, rel_path, alt):
    img_path = ROOT / rel_path
    if not img_path.exists():
        add_callout(doc, f"图片缺失：{rel_path}")
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, before=8, after=2, line=1.0)
    run = p.add_run()
    run.add_picture(str(img_path), width=Inches(5.9))
    add_caption(doc, alt)


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    set_para_spacing(p, before=0, after=3, line=1.2)
    r = p.add_run(text)
    set_run_font(r, size=10.5, color="222222")


def add_number(doc, text):
    p = doc.add_paragraph(style="List Number")
    set_para_spacing(p, before=0, after=3, line=1.2)
    r = p.add_run(text)
    set_run_font(r, size=10.5, color="222222")


def add_body(doc, text):
    p = doc.add_paragraph()
    set_para_spacing(p, before=0, after=6, line=1.25)
    r = p.add_run(text)
    set_run_font(r, size=10.5, color="222222")


def build():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    styles = doc.styles
    for style_name in ["Normal", "List Bullet", "List Number"]:
        style = styles[style_name]
        style.font.name = "Microsoft YaHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        style.font.size = Pt(10.5)

    title = doc.add_paragraph()
    set_para_spacing(title, before=0, after=8, line=1.1)
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = title.add_run("南开校园安全卫士使用手册")
    set_run_font(r, size=24, bold=True, color="0B2545")
    add_bottom_border(title)

    meta = doc.add_paragraph()
    set_para_spacing(meta, before=0, after=12, line=1.15)
    r = meta.add_run("适用对象：学生、编辑员、审核员、保卫处相关工作人员")
    set_run_font(r, size=10, color="666666")

    add_callout(
        doc,
        "本手册说明飞书机器人、网页端学习页面、编辑员工作台、审核员工作台和飞书管理群提醒的使用方法。"
    )

    lines = MD_PATH.read_text(encoding="utf-8").splitlines()
    image_count = 0

    for raw in lines[1:]:
        line = raw.strip()
        if not line:
            continue

        image_match = re.match(r"!\[(.*?)\]\((.*?)\)", line)
        if image_match:
            image_count += 1
            add_image(doc, image_match.group(2), f"图 {image_count}  {image_match.group(1)}")
            continue

        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            text = line.lstrip("#").strip()
            p = doc.add_paragraph()
            if level == 2:
                p.style = doc.styles["Heading 1"]
                set_para_spacing(p, before=16, after=8, line=1.15)
                r = p.add_run(text)
                set_run_font(r, size=16, bold=True, color="2E74B5")
            else:
                p.style = doc.styles["Heading 2"]
                set_para_spacing(p, before=10, after=5, line=1.15)
                r = p.add_run(text)
                set_run_font(r, size=12.5, bold=True, color="1F4D78")
            continue

        if line.startswith(">"):
            add_callout(doc, line.lstrip(">").strip())
            continue

        if re.match(r"^\d+\.\s+", line):
            add_number(doc, re.sub(r"^\d+\.\s+", "", line))
            continue

        if line.startswith("- ") or line.startswith("* "):
            add_bullet(doc, line[2:].strip())
            continue

        add_body(doc, line)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = footer.add_run("南开校园安全卫士 使用手册")
    set_run_font(r, size=9, color="888888")

    doc.save(OUT_PATH)
    print(OUT_PATH)


if __name__ == "__main__":
    build()
