#!/usr/bin/env python3
"""Build the TritonNav research manuscript as LaTeX and a publication PDF."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
PAPER_DIR = ROOT / "paper"
FIGURES_DIR = ROOT / "figures"
SOURCE = PAPER_DIR / "manuscript.md"
PDF_OUTPUT = PAPER_DIR / "tritonnav_field_evaluation.pdf"
TEX_OUTPUT = PAPER_DIR / "tritonnav_field_evaluation.tex"


def read_manuscript():
    text = SOURCE.read_text()
    lines = text.splitlines()
    title = lines[0].removeprefix("# ").strip()
    author = lines[2].strip()
    affiliation = lines[3].strip()
    date = lines[4].strip()
    abstract_start = lines.index("## Abstract") + 1
    intro_start = lines.index("## 1 Introduction")
    abstract = " ".join(line.strip() for line in lines[abstract_start:intro_start] if line.strip())
    body = lines[intro_start:]
    return title, author, affiliation, date, abstract, body


def inline_reportlab(text):
    escaped = html.escape(text, quote=False)
    escaped = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', escaped)
    escaped = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", escaped)
    return escaped


def paragraphs_from_lines(lines):
    items = []
    buffer = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if line.startswith("{{FIGURE:"):
            if buffer:
                items.append(("paragraph", " ".join(buffer)))
                buffer = []
            match = re.fullmatch(r"\{\{FIGURE:([^|]+)\|(.+)\}\}", line)
            if not match:
                raise ValueError(f"Invalid figure marker: {line}")
            items.append(("figure", match.group(1), match.group(2)))
        elif line.startswith("## "):
            if buffer:
                items.append(("paragraph", " ".join(buffer)))
                buffer = []
            items.append(("section", line[3:].strip()))
        elif line.startswith("### "):
            if buffer:
                items.append(("paragraph", " ".join(buffer)))
                buffer = []
            items.append(("subsection", line[4:].strip()))
        elif line.startswith("| "):
            if buffer:
                items.append(("paragraph", " ".join(buffer)))
                buffer = []
            table_lines = []
            while index < len(lines) and lines[index].startswith("| "):
                table_lines.append(lines[index])
                index += 1
            items.append(("table", table_lines))
            continue
        elif not line.strip():
            if buffer:
                items.append(("paragraph", " ".join(buffer)))
                buffer = []
        else:
            buffer.append(line.strip())
        index += 1
    if buffer:
        items.append(("paragraph", " ".join(buffer)))
    return items


def table_data(markdown_lines):
    rows = []
    for line in markdown_lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-+:?", cell) for cell in cells):
            continue
        rows.append(cells)
    return rows


def page_decor(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setStrokeColor(colors.HexColor("#111827"))
    canvas.setLineWidth(0.45)
    canvas.line(0.62 * inch, height - 0.47 * inch, width - 0.62 * inch, height - 0.47 * inch)
    canvas.line(0.62 * inch, 0.43 * inch, width - 0.62 * inch, 0.43 * inch)
    canvas.setFont("Times-Roman", 8)
    canvas.drawCentredString(width / 2, 0.24 * inch, str(doc.page))
    canvas.restoreState()


def build_pdf(title, author, affiliation, date, abstract, body):
    width, height = letter
    margin = 0.62 * inch
    gap = 0.24 * inch
    column_width = (width - 2 * margin - gap) / 2
    first_top_height = 2.62 * inch
    first_body_height = height - (0.55 * inch + first_top_height + 0.55 * inch)

    doc = BaseDocTemplate(
        str(PDF_OUTPUT),
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title=title,
        author=author,
        subject="TritonNav field evaluation and data audit",
    )
    title_frame = Frame(margin, height - 0.55 * inch - first_top_height, width - 2 * margin, first_top_height, id="title", leftPadding=0, rightPadding=0, topPadding=5, bottomPadding=5)
    first_left = Frame(margin, 0.55 * inch, column_width, first_body_height, id="first-left", leftPadding=0, rightPadding=6, topPadding=5, bottomPadding=0)
    first_right = Frame(margin + column_width + gap, 0.55 * inch, column_width, first_body_height, id="first-right", leftPadding=6, rightPadding=0, topPadding=5, bottomPadding=0)
    body_left = Frame(margin, 0.55 * inch, column_width, height - 1.10 * inch, id="body-left", leftPadding=0, rightPadding=6, topPadding=6, bottomPadding=4)
    body_right = Frame(margin + column_width + gap, 0.55 * inch, column_width, height - 1.10 * inch, id="body-right", leftPadding=6, rightPadding=0, topPadding=6, bottomPadding=4)
    wide_frame = Frame(margin, 0.55 * inch, width - 2 * margin, height - 1.10 * inch, id="wide", leftPadding=8, rightPadding=8, topPadding=8, bottomPadding=8)
    doc.addPageTemplates(
        [
            PageTemplate(id="first", frames=[title_frame, first_left, first_right], onPage=page_decor),
            PageTemplate(id="body", frames=[body_left, body_right], onPage=page_decor),
            PageTemplate(id="wide", frames=[wide_frame], onPage=page_decor),
        ]
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("PaperTitle", parent=styles["Title"], fontName="Times-Roman", fontSize=16.5, leading=19, alignment=TA_CENTER, spaceAfter=10)
    author_style = ParagraphStyle("Author", parent=styles["Normal"], fontName="Times-Roman", fontSize=10, leading=13, alignment=TA_CENTER)
    abstract_label = ParagraphStyle("AbstractLabel", parent=styles["Normal"], fontName="Times-Roman", fontSize=9, leading=11, alignment=TA_CENTER, spaceBefore=8, spaceAfter=4)
    abstract_style = ParagraphStyle("Abstract", parent=styles["BodyText"], fontName="Times-Roman", fontSize=8.2, leading=10.1, alignment=TA_JUSTIFY)
    section_style = ParagraphStyle("Section", parent=styles["Heading1"], fontName="Times-Roman", fontSize=11.5, leading=13.5, spaceBefore=8, spaceAfter=4, keepWithNext=True)
    subsection_style = ParagraphStyle("Subsection", parent=styles["Heading2"], fontName="Times-Roman", fontSize=9.7, leading=11.5, spaceBefore=6, spaceAfter=3, keepWithNext=True)
    body_style = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Times-Roman", fontSize=8.35, leading=10.35, alignment=TA_JUSTIFY, spaceAfter=5)
    reference_style = ParagraphStyle("Reference", parent=body_style, fontSize=7.7, leading=9.2, leftIndent=10, firstLineIndent=-10, alignment=TA_LEFT)
    caption_style = ParagraphStyle("Caption", parent=styles["BodyText"], fontName="Times-Roman", fontSize=7.7, leading=9.2, alignment=TA_LEFT, spaceBefore=5, spaceAfter=8)

    story = [
        Paragraph(inline_reportlab(title), title_style),
        Paragraph(inline_reportlab(author), author_style),
        Paragraph(inline_reportlab(affiliation), author_style),
        Paragraph(inline_reportlab(date), author_style),
        Spacer(1, 5),
        Table([[""]], colWidths=[width - 2 * margin], rowHeights=[0.5], style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827"))])),
        Paragraph("Abstract", abstract_label),
        Paragraph(inline_reportlab(abstract), abstract_style),
        NextPageTemplate("body"),
        FrameBreak(),
    ]

    in_references = False
    deferred_figures = {}
    deferred_table = None

    def make_figure(filename, caption, max_width, max_height):
        image_path = FIGURES_DIR / filename
        img = Image(str(image_path))
        scale = min(max_width / img.imageWidth, max_height / img.imageHeight)
        img.drawWidth = img.imageWidth * scale
        img.drawHeight = img.imageHeight * scale
        img.hAlign = "CENTER"
        return KeepTogether([img, Paragraph(inline_reportlab(caption), caption_style)])

    def append_visual_plates():
        if not deferred_figures and deferred_table is None:
            return

        story.extend([NextPageTemplate("wide"), PageBreak()])
        if "figure_07_system_architecture.png" in deferred_figures:
            caption = deferred_figures["figure_07_system_architecture.png"]
            story.append(make_figure("figure_07_system_architecture.png", caption, 6.55 * inch, 3.65 * inch))
            story.append(Spacer(1, 5))
        if deferred_table is not None:
            story.append(deferred_table)

        story.append(PageBreak())
        for filename in ("figure_01_actual_vs_valhalla.png", "figure_05_navigation_issues.png"):
            if filename in deferred_figures:
                story.append(make_figure(filename, deferred_figures[filename], 5.65 * inch, 3.55 * inch))
                story.append(Spacer(1, 4))

        if "figure_06_route_level_performance.png" in deferred_figures:
            story.append(PageBreak())
            story.append(make_figure(
                "figure_06_route_level_performance.png",
                deferred_figures["figure_06_route_level_performance.png"],
                7.0 * inch,
                7.75 * inch,
            ))
        story.extend([NextPageTemplate("body"), PageBreak()])

    for item in paragraphs_from_lines(body):
        kind = item[0]
        if kind == "section":
            if item[1] == "References":
                append_visual_plates()
                in_references = True
            story.append(Paragraph(inline_reportlab(item[1]), section_style))
        elif kind == "subsection":
            story.append(Paragraph(inline_reportlab(item[1]), subsection_style))
        elif kind == "paragraph":
            style = reference_style if in_references else body_style
            story.append(Paragraph(inline_reportlab(item[1]), style))
        elif kind == "figure":
            deferred_figures[item[1]] = item[2]
        elif kind == "table":
            rows = table_data(item[1])
            col_widths = [1.72 * inch, 0.35 * inch, 0.82 * inch, 0.76 * inch, 0.95 * inch, 1.05 * inch]
            table_rows = [[Paragraph(inline_reportlab(cell), ParagraphStyle("Cell", parent=body_style, fontSize=7.3, leading=8.5, alignment=TA_LEFT)) for cell in row] for row in rows]
            table = Table(table_rows, colWidths=col_widths, repeatRows=1, hAlign="CENTER")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E5E7EB")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#9CA3AF")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            deferred_table = KeepTogether([Paragraph("Table 1. Descriptive timing results by analysis set.", caption_style), table])

    doc.build(story)


def tex_escape(text):
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(char, char) for char in text)


def inline_tex(text):
    code_values = []

    def save_code(match):
        code_values.append(match.group(1))
        return f"@@CODE{len(code_values) - 1}@@"

    text = re.sub(r"`([^`]+)`", save_code, text)
    urls = []

    def save_url(match):
        urls.append(match.group(0))
        return f"@@URL{len(urls) - 1}@@"

    text = re.sub(r"https?://\S+", save_url, text)
    text = tex_escape(text)
    text = re.sub(r"\*([^*]+)\*", r"\\textit{\1}", text)
    for index, code in enumerate(code_values):
        text = text.replace(tex_escape(f"@@CODE{index}@@"), r"\texttt{" + tex_escape(code) + "}")
    for index, url in enumerate(urls):
        clean = url.rstrip(".")
        trailing = "." if url.endswith(".") else ""
        text = text.replace(tex_escape(f"@@URL{index}@@"), r"\url{" + clean + "}" + trailing)
    return text


def build_tex(title, author, affiliation, date, abstract, body):
    output = [
        r"\documentclass[9pt,twocolumn]{article}",
        r"\usepackage[letterpaper,margin=0.67in,columnsep=0.24in]{geometry}",
        r"\usepackage{times}",
        r"\usepackage{microtype}",
        r"\usepackage{graphicx}",
        r"\usepackage{booktabs}",
        r"\usepackage{array}",
        r"\usepackage{url}",
        r"\usepackage[hidelinks]{hyperref}",
        r"\setlength{\parindent}{0.12in}",
        r"\setlength{\parskip}{0pt}",
        r"\title{" + inline_tex(title) + "}",
        r"\author{" + inline_tex(author) + r"\\" + inline_tex(affiliation) + "}",
        r"\date{" + inline_tex(date) + "}",
        r"\begin{document}",
        r"\twocolumn[",
        r"\maketitle",
        r"\begin{abstract}",
        inline_tex(abstract),
        r"\end{abstract}",
        r"\vspace{0.12in}",
        r"]",
    ]

    in_references = False
    for item in paragraphs_from_lines(body):
        kind = item[0]
        if kind == "section":
            if item[1] == "References":
                in_references = True
                output.append(r"\begin{thebibliography}{9}")
            else:
                title_text = re.sub(r"^\d+\s+", "", item[1])
                output.append(r"\section{" + inline_tex(title_text) + "}")
        elif kind == "subsection":
            title_text = re.sub(r"^\d+\.\d+\s+", "", item[1])
            output.append(r"\subsection{" + inline_tex(title_text) + "}")
        elif kind == "paragraph":
            if in_references:
                match = re.match(r"\[(\d+)\]\s*(.*)", item[1])
                if match:
                    output.append(r"\bibitem{ref" + match.group(1) + "} " + inline_tex(match.group(2)))
            else:
                output.extend([inline_tex(item[1]), ""])
        elif kind == "figure":
            number_match = re.match(r"Figure\s+(\d+)\.\s*(.*)", item[2])
            caption = number_match.group(2) if number_match else item[2]
            label = number_match.group(1) if number_match else "x"
            output.extend([
                r"\begin{figure*}[t]",
                r"\centering",
                r"\includegraphics[width=0.86\textwidth]{../figures/" + item[1] + "}",
                r"\caption{" + inline_tex(caption) + "}",
                r"\label{fig:" + label + "}",
                r"\end{figure*}",
            ])
        elif kind == "table":
            rows = table_data(item[1])
            output.extend([
                r"\begin{table*}[t]",
                r"\centering",
                r"\caption{Descriptive timing results by analysis set.}",
                r"\small",
                r"\resizebox{\textwidth}{!}{%",
                r"\begin{tabular}{lrrrrr}",
                r"\toprule",
            ])
            for row_index, row in enumerate(rows):
                output.append(" & ".join(inline_tex(cell) for cell in row) + r" \\")
                if row_index == 0:
                    output.append(r"\midrule")
            output.extend([r"\bottomrule", r"\end{tabular}%", r"}", r"\end{table*}"])

    if in_references:
        output.append(r"\end{thebibliography}")
    output.append(r"\end{document}")
    TEX_OUTPUT.write_text("\n".join(output) + "\n")


def main():
    title, author, affiliation, date, abstract, body = read_manuscript()
    build_tex(title, author, affiliation, date, abstract, body)
    build_pdf(title, author, affiliation, date, abstract, body)
    print(f"Created {TEX_OUTPUT}")
    print(f"Created {PDF_OUTPUT}")


if __name__ == "__main__":
    main()
