from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "8月份项目月报与周报"


BLUE = "1F4D78"
ACCENT = "2E74B5"
MUTED = "666666"
TEXT = "222222"
FILL = "EEF4FA"


def set_run(run, size=10.5, bold=False, color=TEXT):
    run.font.name = "Microsoft YaHei"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    run.font.size = Pt(size)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)


def set_para(paragraph, before=0, after=6, line=1.25):
    paragraph.paragraph_format.space_before = Pt(before)
    paragraph.paragraph_format.space_after = Pt(after)
    paragraph.paragraph_format.line_spacing = line


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, v in [("top", top), ("start", start), ("bottom", bottom), ("end", end)]:
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")


def add_bottom_border(paragraph):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "6")
    bottom.set(qn("w:color"), ACCENT)
    p_bdr.append(bottom)


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    set_para(p, before=14 if level == 1 else 8, after=6 if level == 1 else 4, line=1.15)
    run = p.add_run(text)
    set_run(run, size=15 if level == 1 else 12.5, bold=True, color=ACCENT if level == 1 else BLUE)
    return p


def add_body(doc, text):
    p = doc.add_paragraph()
    set_para(p, before=0, after=6, line=1.25)
    set_run(p.add_run(text), size=10.5, color=TEXT)


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        set_para(p, before=0, after=4, line=1.22)
        set_run(p.add_run(item), size=10.5, color=TEXT)


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        set_para(p, before=0, after=4, line=1.22)
        set_run(p.add_run(item), size=10.5, color=TEXT)


def add_meta_table(doc, rows):
    table = doc.add_table(rows=len(rows), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    widths = [Inches(1.35), Inches(5.15)]
    for row_idx, (key, value) in enumerate(rows):
        cells = table.rows[row_idx].cells
        for idx, cell in enumerate(cells):
            cell.width = widths[idx]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cell)
        shade(cells[0], FILL)
        cells[0].text = ""
        cells[1].text = ""
        p0 = cells[0].paragraphs[0]
        set_para(p0, after=0)
        set_run(p0.add_run(key), size=10, bold=True, color=BLUE)
        p1 = cells[1].paragraphs[0]
        set_para(p1, after=0)
        set_run(p1.add_run(value), size=10, color=TEXT)
    doc.add_paragraph()


def add_doc_title(doc, title, subtitle):
    p = doc.add_paragraph()
    set_para(p, before=0, after=6, line=1.1)
    r = p.add_run(title)
    set_run(r, size=22, bold=True, color="0B2545")
    add_bottom_border(p)
    p2 = doc.add_paragraph()
    set_para(p2, before=0, after=12, line=1.15)
    set_run(p2.add_run(subtitle), size=10.5, color=MUTED)


def setup_doc():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.82)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)
    for style_name in ["Normal", "List Bullet", "List Number"]:
        style = doc.styles[style_name]
        style.font.name = "Microsoft YaHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        style.font.size = Pt(10.5)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run(footer.add_run("南开校园安全卫士项目工作报告"), size=9, color="888888")
    return doc


weekly_reports = [
    {
        "file": "第1周周报_8月1日-8月7日.docx",
        "title": "南开校园安全卫士项目周报",
        "period": "2026年8月1日-8月7日",
        "stage": "需求梳理与功能方向确定",
        "summary": "本周主要围绕项目定位、文献借鉴和安全知识模块的改造方向开展工作，明确项目不仅是普通网页展示，而是面向全校师生的个人化、伴随式安全助理。",
        "done": [
            "梳理 CHI 相关文献中关于反诈教育、深度伪造风险、不同学习角色和家庭协助机制的设计思路。",
            "确定安全知识模块由原来的单一答题扩展为“安全答题 + 三角色学习模式”。",
            "围绕体验者、帮助者、观察者三种角色，设计校园高发诈骗情景的不同故事线和结局走向。",
            "明确三角色学习不是简单测验，而是让用户在聊天记录、情景推进和选择判断中完成沉浸式学习。",
        ],
        "issues": [
            "早期页面更像测试模块，真实投入使用感不足。",
            "情景封面和交互方式需要从题目式选择转向更贴近真实校园场景的叙事体验。",
        ],
        "next": [
            "继续优化安全知识页面的信息架构，将学习入口与其他跳转功能区分开。",
            "完善三角色学习的页面表现，使选择更像情景中的心理判断，而不是普通选项题。",
        ],
    },
    {
        "file": "第2周周报_8月8日-8月14日.docx",
        "title": "南开校园安全卫士项目周报",
        "period": "2026年8月8日-8月14日",
        "stage": "案例库与前后端流程搭建",
        "summary": "本周工作重点从前端展示转向真实应用流程建设，开始引入后端服务、案例库、自动采集和人工审核机制。",
        "done": [
            "建立案例库思路，明确案例不应固定写死在前端，而应从官方来源自动采集、查重、脱敏后进入人工流程。",
            "搭建 Node.js 后端服务，并将原本静态页面逐步改造成可读取后端数据的页面。",
            "设计并接入 MySQL 数据库，建立 source_pool、safety_cases、app_state 等核心表。",
            "初步实现每日自动采集、立即采集、查重跳过和新增线索写入数据库的流程。",
            "根据校园安全类型，整理反诈骗、消防安全、交通安全、治安安全、实验室安全、网络安全等分类。",
        ],
        "issues": [
            "早期端口多次变更导致访问路径混乱，需要固定本地服务端口并稳定启动方式。",
            "网页端静态部署与数据库后端之间存在差异，GitHub Pages 只能展示静态页面，不能直接运行 MySQL 后端。",
        ],
        "next": [
            "继续细化数据库字段和案例生命周期状态。",
            "完善编辑员与审核员的分工，使自动采集后的案例能够进入规范人工处理流程。",
        ],
    },
    {
        "file": "第3周周报_8月15日-8月21日.docx",
        "title": "南开校园安全卫士项目周报",
        "period": "2026年8月15日-8月21日",
        "stage": "角色权限、身份验证与工作台优化",
        "summary": "本周围绕“谁来编辑、谁来审核、学生如何被识别”开展建设，形成普通用户、编辑员、审核员三类角色。",
        "done": [
            "将后台拆分为 editor.html 和 reviewer.html 两个页面，分别对应编辑员和审核员工作台。",
            "新增 admin_users 表，用于保存编辑员和审核员的飞书身份、角色和状态。",
            "接入飞书 OAuth 身份验证，编辑员、审核员进入页面时需通过飞书账号识别权限。",
            "新增 students 和 learning_records 表，支持学生端登录识别和学习记录保存。",
            "优化编辑员页面，将待完善/退回修改案例以列表方式展示，点击案例后再展开编辑区，减少页面杂乱感。",
            "明确编辑员必须完成来源可靠、信息完整、脱敏完成、分类准确、安全动作可执行五项要求后才能提交审核。",
        ],
        "issues": [
            "编辑员和审核员角色边界一度不清，需要通过两个页面和数据库角色字段进行明确。",
            "学生端身份验证不是为了限制访问，而是为了记录学习过程，这一逻辑需要在说明材料中表达清楚。",
        ],
        "next": [
            "继续完善审核员页面的已发布案例管理和撤回机制。",
            "优化编辑保存与提交接口，减少点击后响应慢或状态不清的问题。",
        ],
    },
    {
        "file": "第4周周报_8月22日-8月31日.docx",
        "title": "南开校园安全卫士项目周报",
        "period": "2026年8月22日-8月31日",
        "stage": "飞书联动、通知机制与材料整理",
        "summary": "本周主要完成飞书管理群提醒、项目代码上传、使用手册生成和汇报材料补充，使系统从功能开发进一步走向可展示、可说明、可交接。",
        "done": [
            "接入飞书群聊 webhook，用于向案例管理群发送编辑员待编辑和审核员待审核提醒。",
            "设置每天上午 9 点自动发送待办提醒，并在采集到新案例、审核退回案例时触发群内通知。",
            "优化提醒内容，改为简洁的“待编辑 X 条”“待审核 X 条”并附对应页面链接。",
            "修复和说明本地访问问题，明确不能反复打开飞书 callback 临时回调地址，应从 editor/reviewer/knowledge 页面重新进入。",
            "将项目代码上传到 GitHub 仓库，并避免上传真实 .env 密钥配置。",
            "整理项目使用手册，补充飞书机器人菜单、机器人问答、飞书内嵌页面、编辑员、审核员和管理群提醒截图。",
            "阅读论文《Quantifying Risk Perception and Scam Response Among International and Domestic U.S. University Students》和《Toward Proactive Support for Older Adults》（DOI：10.1145/3805036）。",
        ],
        "issues": [
            "当前后端仍主要依赖本地运行，正式部署时需要服务器或云服务承载 Node.js 与 MySQL。",
            "部分页面 UI 仍偏开发阶段，需要继续提升正式应用感和操作反馈。",
        ],
        "next": [
            "推进正式部署方案，区分静态页面展示和后端数据库服务部署。",
            "完善学生学习情况统计功能，为保卫处掌握全校学习进度提供支持。",
        ],
        "conclusion_extra": "本周同时完成两篇论文阅读。",
    },
]

monthly_report = {
    "file": "8月份月报_南开校园安全卫士项目.docx",
    "title": "南开校园安全卫士项目月报",
    "period": "2026年8月",
    "stage": "从功能 Demo 走向可运行应用原型",
    "summary": "8月份项目完成了从静态网页展示到飞书机器人、网页端、后端服务、MySQL 数据库和飞书管理群联动的整体升级。项目定位进一步明确为面向全校师生的个人化、伴随式校园安全助理。",
    "done": [
        "功能定位方面：明确普通用户、编辑员、审核员三类角色。普通用户通过飞书机器人使用智能问答、隐患上报、一键求助和安全知识；编辑员负责整理案例；审核员负责复核和发布。",
        "学生端方面：简化 knowledge 页面，只保留安全答题和三角色学习模式，去除冗余跳转入口，使安全知识页面更符合真实使用场景。",
        "案例库方面：建立以官方来源采集、查重、编辑、审核、发布为核心的案例管理流程，避免将案例固定写死在前端。",
        "数据库方面：接入 MySQL，建立 source_pool、safety_cases、app_state、admin_users、students、learning_records、notification_logs 等表，用于支撑案例、角色、学习记录和通知日志。",
        "身份验证方面：接入飞书 OAuth。编辑员、审核员通过飞书身份进入对应页面；学生进入知识学习页面时也进行身份识别，并记录为普通用户。",
        "飞书联动方面：通过 webhook 将编辑员待办、审核员待办、新案例采集和退回修改等提醒发送到飞书管理群。",
        "材料整理方面：完成项目流程说明、数据库说明、系统架构说明、使用手册，并生成带真实截图的 Word 版本。",
        "代码管理方面：将项目代码上传至 GitHub，上传时保留 .env.example，避免真实密钥和数据库密码外泄。",
    ],
    "effects": [
        "项目从单纯网页 Demo 变成了包含前后端、数据库、飞书身份验证和群提醒的应用原型。",
        "案例学习从固定情景转向可持续更新的案例库机制，为后续接入更多官方来源打下基础。",
        "编辑员和审核员流程更加清晰，案例从采集到发布有了可追踪状态。",
        "学生学习记录机制初步建立，为后续统计未完成学习名单提供数据基础。",
    ],
    "issues": [
        "正式部署仍需进一步完善。目前 GitHub Pages 只能承载静态网页，后端服务和 MySQL 仍需服务器或云平台支撑。",
        "学生学习情况的整体统计页面仍不完善，保卫处暂时还不能直接从后台看到全校学生完成情况汇总。",
        "角色分配和权限管理仍需做成更方便的管理方式，避免后期依赖手动改数据库。",
        "UI 仍有部分开发痕迹，编辑员、审核员页面需要继续优化主次关系、操作反馈和正式应用感。",
        "案例质量还需要提高，后续应增加更严格的来源核验、脱敏检查和情景改编规范。",
    ],
    "next": [
        "确定正式部署方案，将 Node.js 后端和 MySQL 数据库部署到稳定服务器，并配置 HTTPS 与飞书回调地址。",
        "建设学生学习情况统计模块，支持按案例、学院、完成状态导出和查询。",
        "完善后台角色管理，支持对编辑员、审核员和普通用户进行统一维护。",
        "继续优化三角色学习模式，提升情景真实感、分支质量和学习反馈。",
        "建立案例质量标准，形成来源审核、脱敏、分类、风险信号和安全动作的统一编辑规范。",
    ],
}


def build_weekly(report):
    doc = setup_doc()
    add_doc_title(doc, report["title"], f"周期：{report['period']}    阶段：{report['stage']}")
    add_meta_table(doc, [
        ("项目名称", "南开校园安全卫士"),
        ("报告周期", report["period"]),
        ("本周阶段", report["stage"]),
        ("总体状态", "按计划推进，功能持续完善"),
    ])
    add_heading(doc, "一、本周工作概述")
    add_body(doc, report["summary"])
    add_heading(doc, "二、完成的主要工作")
    add_bullets(doc, report["done"])
    add_heading(doc, "三、当前问题")
    add_bullets(doc, report["issues"])
    add_heading(doc, "四、下周计划")
    add_bullets(doc, report["next"])
    add_heading(doc, "五、阶段小结")
    conclusion = "本周工作围绕项目从功能设计向实际可用流程推进展开，重点补齐了对应阶段所需的页面、数据和管理逻辑。后续将继续围绕部署稳定性、案例质量和使用体验进行完善。"
    if report.get("conclusion_extra"):
        conclusion += report["conclusion_extra"]
    add_body(doc, conclusion)
    out = OUT_DIR / report["file"]
    doc.save(out)
    return out


def build_monthly(report):
    doc = setup_doc()
    add_doc_title(doc, report["title"], f"周期：{report['period']}    阶段：{report['stage']}")
    add_meta_table(doc, [
        ("项目名称", "南开校园安全卫士"),
        ("报告周期", report["period"]),
        ("本月阶段", report["stage"]),
        ("总体状态", "已形成可演示、可说明、可继续迭代的应用原型"),
    ])
    add_heading(doc, "一、本月工作概述")
    add_body(doc, report["summary"])
    add_heading(doc, "二、本月完成内容")
    add_bullets(doc, report["done"])
    add_heading(doc, "三、阶段效果")
    add_bullets(doc, report["effects"])
    add_heading(doc, "四、当前问题")
    add_bullets(doc, report["issues"])
    add_heading(doc, "五、下一步计划")
    add_bullets(doc, report["next"])
    add_heading(doc, "六、月度总结")
    add_body(doc, "总体来看，8月份项目完成了较明显的结构升级：前端页面不再只是展示入口，后端、数据库、飞书身份验证和群聊通知共同支撑了案例学习与管理流程。项目已经具备继续向真实校园应用推进的基础，下一阶段重点是稳定部署、完善学生学习统计和提升案例质量。")
    out = OUT_DIR / report["file"]
    doc.save(out)
    return out


def main():
    OUT_DIR.mkdir(exist_ok=True)
    outputs = [build_monthly(monthly_report)]
    outputs.extend(build_weekly(r) for r in weekly_reports)
    for out in outputs:
        print(out)


if __name__ == "__main__":
    main()
