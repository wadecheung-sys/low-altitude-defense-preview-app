# -*- coding: utf-8 -*-
"""生成《处置时间链场景说明》— 五类典型场景下的阶段展示与触发流程。"""
from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENTATION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
WORKSPACE_DOC = (
    Path(__file__).resolve().parents[3]
    / "workspace"
    / "docs"
    / "处置时间链场景说明.docx"
)
DESKTOP_DOC = Path(r"d:\MyFiles\Desktop\处置时间链场景说明.docx")
OUTPUT_PATH = OUTPUT_DIR / "处置时间链场景说明.docx"

FONT = "Microsoft YaHei"
BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
INK = "1F2937"
MUTED = "64748B"
LIGHT_BLUE = "E8EEF5"
LIGHT_GRAY = "F2F4F7"

STAGE_NAMES = ["设备发现", "威胁识别", "威胁评估", "处置执行", "处置结果"]


def set_east_asia_font(run, font=FONT):
    run.font.name = font
    run._element.rPr.rFonts.set(qn("w:eastAsia"), font)
    run._element.rPr.rFonts.set(qn("w:ascii"), font)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), font)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, text, bold=False, color=INK, size=9.5, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(str(text))
    set_east_asia_font(run)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_table_borders(table, color="D7DFE8"):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_width(cell, width_dxa):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.first_child_found_in("w:tcW")
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width_dxa))
    tc_w.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths):
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    tbl_w = tbl_pr.first_child_found_in("w:tblW")
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths)))
    tbl_w.set(qn("w:type"), "dxa")
    grid = tbl.tblGrid
    if grid is not None:
        tbl.remove(grid)
    grid = OxmlElement("w:tblGrid")
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    tbl.insert(0, grid)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            set_cell_width(cell, widths[idx])


def add_heading(document, text, level=1):
    p = document.add_paragraph()
    p.style = f"Heading {level}"
    run = p.add_run(text)
    set_east_asia_font(run)
    run.font.color.rgb = RGBColor.from_string(BLUE if level < 3 else DARK_BLUE)
    return p


def add_body(document, text):
    p = document.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.25
    run = p.add_run(text)
    set_east_asia_font(run)
    run.font.size = Pt(10.5)
    run.font.color.rgb = RGBColor.from_string(INK)
    return p


def add_bullet(document, text):
    p = document.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Cm(0.95)
    p.paragraph_format.first_line_indent = Cm(-0.45)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.25
    run = p.add_run(text)
    set_east_asia_font(run)
    run.font.size = Pt(10.2)
    run.font.color.rgb = RGBColor.from_string(INK)
    return p


def add_table(document, headers, rows, widths, header_fill=LIGHT_BLUE, font_size=9.0):
    table = document.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.style = "Table Grid"
    set_table_geometry(table, widths)
    set_table_borders(table)
    for idx, header in enumerate(headers):
        cell = table.rows[0].cells[idx]
        set_cell_shading(cell, header_fill)
        set_cell_text(
            cell, header, bold=True, color="0F172A", size=font_size, align=WD_ALIGN_PARAGRAPH.CENTER
        )
    for row in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row):
            set_cell_text(cells[idx], value, size=font_size)
    document.add_paragraph("")
    return table


def add_scenario_section(document, title, trigger, flow_summary, stage_rows):
    add_heading(document, title, 2)
    add_body(document, f"触发条件：{trigger}")
    add_body(document, f"流程特征：{flow_summary}")
    add_table(
        document,
        ["阶段", "节点状态", "展示要点", "概要示例（变量按实际事件替换）"],
        stage_rows,
        [1200, 1100, 2600, 4460],
        font_size=8.5,
    )


SCENARIOS = [
    {
        "title": "3.1 黑飞无人机入侵",
        "trigger": (
            "识别码无法解析（uavSn=未解析），或目标型号无法对应已知设备档案；"
            "名单类型为「未知」；目标进入防护区域或触发异常行为规则。"
        ),
        "flow": (
            "属于非合作式黑飞目标。系统仍完整经过发现、识别、评估三阶段；"
            "威胁等级通常为中危及以上时命中「非合作式无人机入侵反制」预案并联动反制设备；"
            "低危或未命中预案时，处置执行可展示为「未触发」并说明原因。"
        ),
        "stages": [
            [
                "设备发现",
                "已完成",
                "展示发现设备、原始目标编号、位置、轨迹特征、数据来源；不做身份判断。",
                "[T1] 雷达-01发现疑似低空目标，已形成原始探测记录。",
            ],
            [
                "威胁识别",
                "已完成",
                "目标类型=疑似无人机/无人机；身份属性=非合作式黑飞目标；识别码=未解析。",
                "[T2] 完成目标识别，判定为疑似无人机，身份属性为非合作式黑飞目标。",
            ],
            [
                "威胁评估",
                "已完成",
                "命中规则=非合作式目标进入重点区域/活动；输出威胁等级。",
                "[T3] 根据威胁评估规则，目标命中N项条件，评估结果为{威胁等级}。",
            ],
            [
                "处置执行",
                "已完成/进行中/未触发",
                "已命中预案：策略=非合作式无人机入侵反制，联动反制设备执行驱离/压制/打击；"
                "未命中：展示未触发原因（威胁较低、未命中预案等）。",
                "[T4] 命中预案策略「非合作式无人机入侵反制」，已联动1台反制设备执行定向驱离。",
            ],
            [
                "处置结果",
                "已完成",
                "展示最终处置状态与结果（驱离成功、迫降成功等）或事件自然结束原因。",
                "[T5] 事件已闭环，最终结果为驱离成功。",
            ],
        ],
    },
    {
        "title": "3.2 未知无人机入侵",
        "trigger": (
            "识别码可解析，但名单类型为「未知」（未在本系统黑白名单备案）；"
            "目标进入监测/防护区域并触发威胁评估规则。"
        ),
        "flow": (
            "身份属性判定为合作式无人机，但缺乏名单授权信息，仍按常规入侵流程评估与处置；"
            "识别阶段突出「名单属性=未知」；评估使用常规无人机目标评估规则或区域入侵规则。"
        ),
        "stages": [
            [
                "设备发现",
                "已完成",
                "同设备发现阶段，展示多源探测记录。",
                "[T1] 无线电-02、融合节点-A发现疑似低空目标，已形成原始探测记录。",
            ],
            [
                "威胁识别",
                "已完成",
                "目标类型=无人机；身份属性=合作式无人机；名单属性=未知；识别码可展示具体 SN。",
                "[T2] 完成目标识别，判定为无人机，身份属性为合作式无人机。",
            ],
            [
                "威胁评估",
                "已完成",
                "命中常规无人机目标评估规则或区域相关规则；输出威胁等级。",
                "[T3] 根据威胁评估规则，目标命中1项条件，评估结果为{威胁等级}。",
            ],
            [
                "处置执行",
                "已完成/进行中/未触发",
                "高威胁命中「高威胁目标联动反制」或「常规无人机处置预案」；低危可未触发反制。",
                "[T4] 命中预案策略「常规无人机处置预案」，已联动1台反制设备执行定向驱离。",
            ],
            [
                "处置结果",
                "已完成",
                "展示处置结论；若目标自然飞离则结果为自离/自然脱离。",
                "[T5] 事件已闭环，最终结果为{处置结果}。",
            ],
        ],
    },
    {
        "title": "3.3 黑名单无人机入侵",
        "trigger": "名单类型=黑名单；目标进入防护区域或触发黑名单关联规则。",
        "flow": (
            "识别阶段突出黑名单命中；评估阶段使用「黑名单目标进入重点区域/活动」规则；"
            "通常命中「黑名单无人机入侵反制」预案并联动反制；全流程五阶段完整展示。"
        ),
        "stages": [
            [
                "设备发现",
                "已完成",
                "展示发现设备与原始探测信息。",
                "[T1] 雷达-01 (2.4G)发现疑似低空目标，已形成原始探测记录。",
            ],
            [
                "威胁识别",
                "已完成",
                "身份属性=黑名单目标；标签含「黑名单」「系统识别/人工识别」。",
                "[T2] 完成目标识别，判定为无人机，身份属性为黑名单目标。",
            ],
            [
                "威胁评估",
                "已完成",
                "命中规则=黑名单目标进入重点区域；威胁等级通常为中危或高危。",
                "[T3] 根据威胁评估规则，目标命中2项条件，评估结果为高危。",
            ],
            [
                "处置执行",
                "已完成",
                "策略=黑名单无人机入侵反制；展示联动反制设备与执行动作。",
                "[T4] 命中预案策略「黑名单无人机入侵反制」，已联动1台反制设备执行定向驱离。",
            ],
            [
                "处置结果",
                "已完成",
                "处置状态=已处置；结果标签可为驱离、迫降、压制等。",
                "[T5] 事件已闭环，最终结果为驱离成功。",
            ],
        ],
    },
    {
        "title": "3.4 白名单无人机飞行（仅监测）",
        "trigger": (
            "名单类型=白名单；目标在授权区域通行或未触发异常行为条件；"
            "系统持续监测但不执行反制。"
        ),
        "flow": (
            "发现、识别、评估三阶段正常展示；评估规则为「白名单目标授权通行」，威胁等级通常为低危/无危；"
            "处置执行展示为「未触发」轻量节点，说明白名单未触发反制条件；"
            "处置结果展示监测闭环（已结束/已处置），不联动反制设备。"
        ),
        "stages": [
            [
                "设备发现",
                "已完成",
                "展示探测记录；与白名单身份无关，仅记录原始发现事实。",
                "[T1] 光电-01发现疑似低空目标，已形成原始探测记录。",
            ],
            [
                "威胁识别",
                "已完成",
                "身份属性=白名单目标；标签含「白名单」。",
                "[T2] 完成目标识别，判定为无人机，身份属性为白名单目标。",
            ],
            [
                "威胁评估",
                "已完成",
                "命中规则=白名单目标授权通行；威胁等级偏低。",
                "[T3] 根据威胁评估规则，目标命中1项条件，评估结果为低危。",
            ],
            [
                "处置执行",
                "未触发",
                "不联动反制设备；摘要必须说明原因：白名单目标未触发异常行为条件。",
                "[T4] 未命中反制预案，未下发处置指令；原因：白名单目标未触发异常行为条件。",
            ],
            [
                "处置结果",
                "已完成",
                "事件以监测记录归档；可能为已结束（自然脱离）或已处置（记录完成）。",
                "[T5] 事件已闭环，最终结果为{监测归档结果}。",
            ],
        ],
    },
    {
        "title": "3.5 躁扰告警",
        "trigger": (
            "识别或人工核查判定为躁扰类目标：飞鸟、气球、风筝、地面杂波、其他低慢小非无人机信号；"
            "或系统/人工结论为躁扰告警、误报排除等。"
        ),
        "flow": (
            "威胁识别阶段目标类型为飞鸟躁扰/躁扰告警；身份属性为非无人机目标；"
            "威胁评估仍执行但等级通常偏低；处置执行不进入反制流程（未触发）；"
            "处置结果以扰动排除、误报排除、飞鸟躁扰等结论闭环，事件状态多为已结束。"
        ),
        "stages": [
            [
                "设备发现",
                "已完成",
                "原始探测信号存在；可能来自雷达/无线电误检或空飘物反射。",
                "[T1] 雷达-03 (5.8G)发现疑似低空目标，已形成原始探测记录。",
            ],
            [
                "威胁识别",
                "已完成",
                "目标类型=飞鸟躁扰/躁扰告警；标签含飞鸟躁扰、地面杂波、误报排除等；"
                "人工核查后展示核查结论。",
                "[T2] 完成目标识别，判定为飞鸟躁扰。（人工核查时为人工识别+躁扰告警）",
            ],
            [
                "威胁评估",
                "已完成",
                "命中规则=目标类型排除规则；威胁等级通常为低危。",
                "[T3] 根据威胁评估规则，目标命中1项条件，评估结果为低危。",
            ],
            [
                "处置执行",
                "未触发",
                "不联动反制；原因=目标识别为飞鸟或躁扰信号，未进入反制处置流程。",
                "[T4] 未命中反制预案，未下发处置指令；原因：目标识别为飞鸟或躁扰信号，未进入反制处置流程。",
            ],
            [
                "处置结果",
                "已完成",
                "处置状态=已结束；结果=飞鸟或躁扰信号排除/扰动排除/误报排除；不执行反制。",
                "[T5] 事件已闭环，最终结果为飞鸟或躁扰信号排除。",
            ],
        ],
    },
]


def build_document() -> Document:
    document = Document()
    section = document.sections[0]
    section.orientation = WD_ORIENTATION.PORTRAIT
    section.top_margin = Cm(2.2)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)

    styles = document.styles
    styles["Normal"].font.name = FONT
    styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    styles["Normal"].font.size = Pt(10.5)
    for style_name, size, color in [("Heading 1", 16, BLUE), ("Heading 2", 13, BLUE), ("Heading 3", 12, DARK_BLUE)]:
        style = styles[style_name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor.from_string(color)

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("处置时间链场景说明")
    set_east_asia_font(run)
    run.bold = True
    run.font.size = Pt(18)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("历史事件详情页 · 五类典型场景下的阶段展示与触发流程")
    set_east_asia_font(run)
    run.font.size = Pt(10.5)
    run.font.color.rgb = RGBColor.from_string(MUTED)
    document.add_paragraph("")

    add_table(
        document,
        ["项目", "说明"],
        [
            ["适用模块", "历史事件 / 飞行记录详情 / 处置时间链"],
            ["阶段模型", "设备发现 → 威胁识别 → 威胁评估 → 处置执行 → 处置结果"],
            ["展示原则", "仅展示已发生、进行中或需解释「为何未反制」的未触发节点；未开始节点隐藏"],
            ["本文范围", "说明五类场景在何种条件下触发，以及各阶段应呈现的内容（不含全量字段字典）"],
        ],
        [2100, 7260],
        header_fill=LIGHT_GRAY,
    )

    add_heading(document, "一、阶段模型与节点状态", 1)
    add_body(
        document,
        "处置时间链用于解释一条历史事件从原始探测到闭环归档的过程。各场景共用同一五阶段顺序，"
        "差异体现在识别结论、评估规则、是否联动反制及最终结果。"
    )
    add_table(
        document,
        ["阶段", "业务含义", "节点状态说明"],
        [
            ["设备发现", "记录原始探测事实，不做身份判断", "固定为「已完成」"],
            ["威胁识别", "融合识别目标类型、名单属性、识别码解析结果", "固定为「已完成」"],
            ["威胁评估", "按威胁评估规则输出威胁等级与命中依据", "固定为「已完成」"],
            ["处置执行", "预案策略触发与反制设备联动", "已完成 / 进行中 / 未触发（需说明原因）"],
            ["处置结果", "事件闭环结论", "已完成；进行中事件在处置完成前可暂不展示"],
        ],
        [1400, 3200, 4760],
        font_size=9.0,
    )

    add_heading(document, "二、场景识别条件对照", 1)
    add_table(
        document,
        ["场景", "关键识别条件", "身份/名单判定", "是否联动反制"],
        [
            ["黑飞无人机入侵", "识别码=未解析；型号未知或无法建档", "非合作式黑飞目标；名单=未知", "视威胁等级与预案，通常联动"],
            ["未知无人机入侵", "识别码可解析；名单=未知", "合作式无人机；未备案", "视威胁等级与预案"],
            ["黑名单无人机入侵", "名单=黑名单", "黑名单目标", "通常联动反制"],
            ["白名单无人机飞行", "名单=白名单；无异常行为", "白名单目标", "不联动（仅监测）"],
            ["躁扰告警", "识别/核查为飞鸟、气球、杂波等非无人机", "非无人机目标", "不联动"],
        ],
        [1600, 2800, 2400, 2560],
        font_size=8.8,
    )

    add_heading(document, "三、分场景触发流程与展示内容", 1)
    add_body(
        document,
        "以下各节仅描述该场景下**会被触发并展示**的阶段内容。表格中 T1～T5 为阶段时间占位，"
        "实际文案由事件数据中的时间、设备名、威胁等级等变量替换生成。"
    )
    for scenario in SCENARIOS:
        add_scenario_section(
            document,
            scenario["title"],
            scenario["trigger"],
            scenario["flow"],
            scenario["stages"],
        )

    add_heading(document, "四、跨场景差异摘要", 1)
    add_table(
        document,
        ["对比项", "黑飞", "未知", "黑名单", "白名单", "躁扰"],
        [
            ["识别码", "未解析", "可解析", "可解析", "可解析", "通常无关/未解析"],
            ["名单类型", "未知", "未知", "黑名单", "白名单", "未知"],
            ["处置执行", "可联动", "可联动", "联动", "未触发", "未触发"],
            ["典型结果", "驱离/迫降", "驱离/自离", "驱离/压制", "监测归档", "扰动/误报排除"],
            ["人工核查", "可选", "可选", "可选", "少见", "常见（确认躁扰类型）"],
        ],
        [1400, 1300, 1300, 1300, 1300, 1300],
        font_size=8.5,
    )

    add_heading(document, "五、与系统实现的对应关系", 1)
    add_bullet(document, "文案与节点构建逻辑见 preview-app：src/api/lad/incident/disposalTimeline.ts。")
    add_bullet(document, "详情页组件：src/views/Lad/Incident/components/DisposalTimelinePanel.vue。")
    add_bullet(document, "验证方式（自动识别/人工核查）在处置结果阶段「核查方式」字段体现，不单独占用时间链阶段。")
    add_bullet(document, "反制设备名称展示仅保留设备名（如干扰-01），不含（自动）（人工）等后缀。")

    add_heading(document, "六、编写与验收要点", 1)
    add_bullet(document, "每个场景至少准备 1 条可演示的历史事件 mock 数据，覆盖五阶段或说明未触发原因。")
    add_bullet(document, "未触发处置执行的场景，摘要必须包含 skipReason，避免用户误解为系统故障。")
    add_bullet(document, "进行中事件（待处置/处置中）应停留在处置执行阶段，处置结果阶段待闭环后再展示。")
    add_bullet(document, "躁扰类事件不得出现反制设备联动内容，除非后续业务规则扩展。")

    return document


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    WORKSPACE_DOC.parent.mkdir(parents=True, exist_ok=True)
    doc = build_document()
    doc.save(OUTPUT_PATH)
    shutil.copy2(OUTPUT_PATH, WORKSPACE_DOC)
    try:
        shutil.copy2(OUTPUT_PATH, DESKTOP_DOC)
    except PermissionError:
        alt = DESKTOP_DOC.with_name("处置时间链场景说明-生成.docx")
        shutil.copy2(OUTPUT_PATH, alt)
        print(f"Desktop locked, saved: {alt}")
    print(f"Saved: {OUTPUT_PATH}")
    print(f"Saved: {WORKSPACE_DOC}")
    print(f"Saved: {DESKTOP_DOC}")


if __name__ == "__main__":
    main()
