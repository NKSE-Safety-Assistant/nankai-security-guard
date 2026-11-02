from pathlib import Path
import re

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "南开校园安全卫士项目交接文档.md"
OUTPUT = ROOT / "docs" / "南开校园安全卫士项目交接文档.docx"


def set_font(run, name="Microsoft YaHei", size=10.5, bold=None, color="000000"):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=120, start=130, bottom=120, end=130):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table, color="D9D9D9", size="6"):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = borders.find(qn(f"w:{edge}"))
        if tag is None:
            tag = OxmlElement(f"w:{edge}")
            borders.append(tag)
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), size)
        tag.set(qn("w:color"), color)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("第 ")
    set_font(run, size=9, color="6B7280")
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, end])
    tail = paragraph.add_run(" 页")
    set_font(tail, size=9, color="6B7280")


def clean_inline(text):
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return text.strip()


def add_rich_text(paragraph, text, size=10.5, color="222222"):
    pattern = re.compile(r"(\*\*.*?\*\*|`.*?`)")
    pos = 0
    for match in pattern.finditer(text):
        if match.start() > pos:
            run = paragraph.add_run(text[pos:match.start()])
            set_font(run, size=size, color=color)
        token = match.group(0)
        if token.startswith("**"):
            run = paragraph.add_run(token[2:-2])
            set_font(run, size=size, bold=True, color=color)
        else:
            run = paragraph.add_run(token[1:-1])
            set_font(run, name="Consolas", size=max(9, size - 0.5), color="1F4F73")
        pos = match.end()
    if pos < len(text):
        run = paragraph.add_run(text[pos:])
        set_font(run, size=size, color=color)


doc = Document()
section = doc.sections[0]
section.top_margin = Cm(1.9)
section.bottom_margin = Cm(1.8)
section.left_margin = Cm(2.1)
section.right_margin = Cm(2.1)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Microsoft YaHei"
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
normal.font.size = Pt(10.5)
normal.paragraph_format.space_after = Pt(7)
normal.paragraph_format.line_spacing = 1.35

title_style = styles["Title"]
title_style.font.name = "Microsoft YaHei"
title_style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
title_style.font.size = Pt(25)
title_style.font.bold = True
title_style.font.color.rgb = RGBColor(0, 0, 0)
title_style.paragraph_format.space_after = Pt(18)

for name, size, before, after in (("Heading 1", 17, 18, 8), ("Heading 2", 13, 13, 6)):
    style = styles[name]
    style.font.name = "Microsoft YaHei"
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.keep_with_next = True

footer = section.footer
footer_p = footer.paragraphs[0]
footer_p.text = "南开校园安全卫士项目交接文档"
footer_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
for run in footer_p.runs:
    set_font(run, size=9, color="6B7280")
add_page_number(footer.add_paragraph())

lines = SOURCE.read_text(encoding="utf-8").splitlines()
i = 0
in_code = False
code_lines = []

while i < len(lines):
    raw = lines[i]
    line = raw.strip()
    if line.startswith("```"):
        if in_code:
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.5)
            p.paragraph_format.right_indent = Cm(0.5)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run("\n".join(code_lines))
            set_font(run, name="Consolas", size=9, color="333333")
            in_code = False
            code_lines = []
        else:
            in_code = True
        i += 1
        continue
    if in_code:
        code_lines.append(raw)
        i += 1
        continue
    if not line:
        i += 1
        continue
    if line.startswith("# "):
        p = doc.add_paragraph(style="Title")
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(clean_inline(line[2:]))
    elif line.startswith("## "):
        doc.add_paragraph(clean_inline(line[3:]), style="Heading 1")
    elif line.startswith("### "):
        doc.add_paragraph(clean_inline(line[4:]), style="Heading 2")
    elif line.startswith("|"):
        rows = []
        while i < len(lines) and lines[i].strip().startswith("|"):
            cells = [clean_inline(x) for x in lines[i].strip().strip("|").split("|")]
            if not all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells):
                rows.append(cells)
            i += 1
        if rows:
            col_count = max(len(row) for row in rows)
            table = doc.add_table(rows=len(rows), cols=col_count)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = True
            set_table_borders(table)
            for r_idx, row in enumerate(rows):
                for c_idx in range(col_count):
                    cell = table.cell(r_idx, c_idx)
                    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                    set_cell_margins(cell)
                    value = row[c_idx] if c_idx < len(row) else ""
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(0)
                    if c_idx > 0 and re.fullmatch(r"\d+", value):
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    add_rich_text(p, value, size=9.2, color="FFFFFF" if r_idx == 0 else "222222")
                    if r_idx == 0:
                        set_cell_shading(cell, "1F4F73")
                        for run in p.runs:
                            run.bold = True
                    elif r_idx % 2 == 0:
                        set_cell_shading(cell, "F3F7FA")
            table.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
            doc.add_paragraph().paragraph_format.space_after = Pt(1)
        continue
    elif re.match(r"^\d+\.\s+", line):
        text = re.sub(r"^\d+\.\s+", "", line)
        p = doc.add_paragraph(style="List Number")
        p.paragraph_format.space_after = Pt(4)
        add_rich_text(p, text)
    elif line.startswith("- ["):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(4)
        add_rich_text(p, "□ " + re.sub(r"^- \[[ xX]\]\s*", "", line))
    elif line.startswith("- "):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(4)
        add_rich_text(p, line[2:])
    else:
        p = doc.add_paragraph()
        add_rich_text(p, line)
    i += 1

for p in doc.paragraphs:
    if p.style.name == "Title":
        continue
    p.paragraph_format.widow_control = True

props = doc.core_properties
props.title = "南开校园安全卫士项目交接文档"
props.subject = "2026年10月27日项目交接"
props.author = "南开校园安全卫士项目组"
props.keywords = "南开校园安全卫士, 项目交接, 消防活动, 数据库"

doc.save(OUTPUT)
print(OUTPUT)
