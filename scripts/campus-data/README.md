# UCSD campus data audit

This workflow reads public UC San Diego sources, stores timestamped snapshots in the already-ignored `data/campus/imports/raw/` directory, normalizes them into the already-ignored `data/campus/imports/generated/` directory, and writes comparison reports under `reports/`. It never writes `data/campus/*.js` or automatically creates a PR.

```sh
npm run campus-data:audit
```

The building pipeline reads the public [Buildings Campus Map ArcGIS service](https://admin-enterprise-gis.ucsd.edu/server/rest/services/Buildings/Buildings_Campus_Map/MapServer), including point and footprint layers. It preserves lifecycle metadata; GIS `Construction` remains a construction candidate even when another newer UCSD source says a building is open.

The classroom and media pipeline reads the public [Facilities classroom export](https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes). The export is SpreadsheetML served as an `.xls` download. Classroom rows are joined to media rows by Registrar Code. Empty fields stay empty; unknown room coordinates and internal paths are not inferred.

The comparison uses a broad campus-core envelope to keep UCSD-wide facilities outside the primary candidate list. This envelope is a discovery aid only. An unmatched GIS record is not automatically a TritonNav destination. Room links are made only when an official building name or alias exactly matches a current canonical record; unresolved room links are reported.

Reports include new building candidates, classroom differences, unmatched building-to-room links, and a Ridge Walk North inventory. Review source lifecycle conflicts, college/building aliases, the 19 Ridge Walk North classroom-export records, and room anchors before any data PR. Local validation checks IDs, coordinates, room/building/entrance references, aliases, HTTPS source URLs when present, and coverage of all eight colleges.

The Tuesday GitHub Action runs at 17:00 UTC (09:00 PDT or 10:00 PST), supports `workflow_dispatch`, uses concurrency protection, and has only `contents: read` and `issues: write`. It creates or updates a dated issue only when the comparison finds candidates. It does not modify campus data or open a PR.

The initial Markdown reports are committed as review evidence. Full generated JSON comparisons, including detailed footprint coordinates, remain ignored locally and are uploaded with the Markdown reports as Actions artifacts. Regenerate them with the audit command; they are not canonical campus data.
