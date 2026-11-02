import json
from collections import Counter
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "quiz-questions.json"
OUTPUT = ROOT / "南开校园安全卫士最新题库.docx"
FONT = "Microsoft YaHei"
BLUE = RGBColor(46, 116, 181)
DARK_BLUE = RGBColor(31, 77, 120)
GRAY = RGBColor(95, 99, 104)
GREEN = RGBColor(27, 94, 64)


def set_east_asia(run, font=FONT):
    run.font.name = font
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), font)


def set_style(doc, name, size, color, bold=False, before=0, after=6, line=1.25):
    style = doc.styles[name]
    style.font.name = FONT
    style._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), FONT)
    style.font.size = Pt(size)
    style.font.color.rgb = color
    style.font.bold = bold
    fmt = style.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line


def add_page_number(paragraph):
    paragraph.add_run("第 ")
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    paragraph._p.append(field)
    paragraph.add_run(" 页")


def add_label_paragraph(doc, label, value, color=None, keep=False):
    p = doc.add_paragraph(style="Normal")
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.first_line_indent = Inches(-0.18)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = keep
    r = p.add_run(label)
    set_east_asia(r)
    r.bold = True
    r.font.color.rgb = color or DARK_BLUE
    value_run = p.add_run(value)
    set_east_asia(value_run)
    return p


data = json.loads(SOURCE.read_text(encoding="utf-8"))
questions = data["questions"]
categories = list(dict.fromkeys(q["category"] for q in questions))
counts = Counter(q["category"] for q in questions)
difficulties = Counter(q["difficulty"] for q in questions)

doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = section.bottom_margin = Inches(0.78)
section.left_margin = section.right_margin = Inches(0.86)
section.header_distance = section.footer_distance = Inches(0.42)

set_style(doc, "Normal", 10.5, RGBColor(32, 33, 36), after=6, line=1.25)
set_style(doc, "Title", 25, RGBColor(11, 37, 69), bold=True, after=10, line=1.0)
set_style(doc, "Subtitle", 11, GRAY, after=5, line=1.15)
set_style(doc, "Heading 1", 16, BLUE, bold=True, before=18, after=10, line=1.1)
set_style(doc, "Heading 2", 12, DARK_BLUE, bold=True, before=10, after=5, line=1.15)

header = section.header.paragraphs[0]
header.text = "南开校园安全卫士｜安全知识题库"
header.style = doc.styles["Subtitle"]
footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer.style = doc.styles["Subtitle"]
add_page_number(footer)

for _ in range(4):
    doc.add_paragraph()
title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.add_run("南开校园安全卫士\n最新题库")
subtitle = doc.add_paragraph(style="Subtitle")
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
subtitle.add_run(f"版本：{data.get('version', '未标注')}  ｜  共 {len(questions)} 道题")
meta = doc.add_paragraph(style="Normal")
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta.paragraph_format.space_before = Pt(18)
meta.add_run("题型结构：")
meta.runs[-1].bold = True
meta.add_run("；".join(f"{name}{count}题" for name, count in counts.items()))
meta2 = doc.add_paragraph(style="Normal")
meta2.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta2.add_run(f"难度：基础{difficulties.get('基础', 0)}题，进阶{difficulties.get('进阶', 0)}题")
note = doc.add_paragraph(style="Normal")
note.alignment = WD_ALIGN_PARAGRAPH.CENTER
note.paragraph_format.space_before = Pt(28)
note_run = note.add_run("文档包含题目、选项、正确答案、解析及来源类型")
set_east_asia(note_run)
note_run.font.color.rgb = GRAY

for category_index, category in enumerate(categories):
    doc.add_page_break()
    heading = doc.add_paragraph(style="Heading 1")
    heading.add_run(f"{category}（{counts[category]}题）")
    category_questions = [q for q in questions if q["category"] == category]
    for local_index, q in enumerate(category_questions, 1):
        q_heading = doc.add_paragraph(style="Heading 2")
        q_heading.paragraph_format.keep_with_next = True
        q_heading.add_run(f"{local_index}. {q['question']}")

        labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        for option_index, option in enumerate(q["options"]):
            p = doc.add_paragraph(style="Normal")
            p.paragraph_format.left_indent = Inches(0.34)
            p.paragraph_format.first_line_indent = Inches(-0.24)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(f"{labels[option_index]}. ")
            set_east_asia(r)
            r.bold = True
            option_run = p.add_run(option)
            set_east_asia(option_run)

        answer_index = q["answer"]
        answer_text = f"{labels[answer_index]}. {q['options'][answer_index]}"
        add_label_paragraph(doc, "正确答案：", answer_text, GREEN, keep=True)
        add_label_paragraph(doc, "解析：", q.get("explain", "未提供"), keep=True)
        add_label_paragraph(
            doc,
            "题目信息：",
            f"编号 {q['id']}｜场景 {q['scene']}｜难度 {q['difficulty']}｜审核状态 {q['reviewStatus']}",
            keep=True,
        )
        add_label_paragraph(doc, "来源类型：", q.get("sourceType", "未标注"))

doc.core_properties.title = "南开校园安全卫士最新题库"
doc.core_properties.subject = "校园安全知识学习题库"
doc.core_properties.keywords = "南开大学,校园安全,题库"
doc.save(OUTPUT)
print(OUTPUT)
