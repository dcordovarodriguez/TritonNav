# Campus GIS Import Drop Zone

Place future UC San Diego GIS data drops under `data/campus/imports/raw/`.

This directory is intentionally separate from the application fixtures in `data/campus/*.js`. Raw GIS files and generated previews are ignored by Git so official data can be inspected locally without accidentally committing restricted or bulky source files.

## Supported Inputs

- GeoJSON `FeatureCollection`
- GeoJSON feature arrays
- ArcGIS REST / FeatureServer exports saved as GeoJSON
- Shapefiles converted to GeoJSON outside this repository
- CSV data converted to GeoJSON before import

## Workflow

1. Copy official files into `data/campus/imports/raw/`.
2. Copy `manifest.example.json` to a local manifest outside Git or provide an explicit manifest path.
3. Run `npm run check:campus-gis`.
4. Review validation errors, warnings, and ambiguous matches.
5. Inspect coverage with the generated report.
6. Only after review, promote normalized records into the application fixtures in a separate approved change.

The current pipeline is a dry-run preview. It does not rewrite application data and does not connect to external UCSD services.

## Replacement Rules

Official records may supersede provisional records when matching is stable by:

- Official source ID
- Canonical TritonNav ID
- Building code
- Normalized name
- Known aliases

Ambiguous matches are reported for manual review and are never silently merged.
