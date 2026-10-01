# Manuscript outputs

The approved manuscript is available in three forms:

- `manuscript.md`: canonical readable source.
- `tritonnav_field_evaluation.tex`: conference-style LaTeX source.
- `tritonnav_field_evaluation.pdf`: visually verified publication PDF.

The verified bibliography is also provided as `references.bib`. The PDF and
LaTeX include only approved Figures 1, 5, 6, and 7.

Rebuild the LaTeX and PDF from the Markdown source with:

```bash
python3 research/scripts/build_research_paper.py
```

The PDF builder requires ReportLab. LaTeX compilation is optional; the checked
in `.tex` file uses standard article, geometry, graphicx, booktabs, array, url,
and hyperref packages.
