# TritonNav Field-Test Research Analysis

This directory contains reproducible research outputs derived from the completed
TritonNav campus field-test workbook. The source workbook remains outside the
repository and is never modified by these scripts.

## Reproduce the analysis

```bash
python3 research/scripts/analyze_field_trials.py \
  --workbook /path/to/TritonNav_Campus_Field_Test_Workbook.xlsx

node research/scripts/capture_valhalla_snapshot.mjs

python3 research/scripts/analyze_field_trials.py \
  --workbook /path/to/TritonNav_Campus_Field_Test_Workbook.xlsx

node research/scripts/build_preview_workbook.mjs
```

The first Python pass audits the workbook and writes missing-route candidates.
The Node script resolves those candidates through TritonNav's current campus
resolver and local `/api/routes/walking` endpoint. The second Python pass adds
those current-provider values as clearly labeled modeled scenarios. It does not
replace historical observations.

## Provenance policy

- `measured`: values directly recorded in the source workbook.
- `calculated`: deterministic transformations of recorded values, such as a
  timestamp difference or signed error.
- `modeled`: current Valhalla outputs or scenarios derived from those outputs.
- `proposed`: a value requiring explicit approval before manuscript use.

The approval outcome is recorded in `data/approval_decisions.json`. The final
paper keeps measured-only results primary, uses timestamp-derived values only
as supplemental sensitivity data, and keeps the 12 scenario-filled records in
a separate exploratory analysis.

Build the approved manuscript with:

```bash
python3 research/scripts/build_research_paper.py
```
