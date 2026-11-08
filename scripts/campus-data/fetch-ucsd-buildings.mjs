import path from "node:path";
import { GIS_ROOT, RAW_DIR, ensureDir, fetchJson, stamp, writeJson } from "./common.mjs";

const timestamp = new Date().toISOString();
const params = new URLSearchParams({ where: "1=1", outFields: "*", returnGeometry: "true", outSR: "4326", f: "geojson", resultRecordCount: "2000" });
const [metadata, points, footprints] = await Promise.all([
  fetchJson(`${GIS_ROOT}?f=pjson`),
  fetchJson(`${GIS_ROOT}/0/query?${params}`),
  fetchJson(`${GIS_ROOT}/2/query?${params}`)
]);
if (!Array.isArray(points.features) || !Array.isArray(footprints.features)) throw new Error("Expected GeoJSON feature collections from UCSD GIS.");
await ensureDir(RAW_DIR);
const file = path.join(RAW_DIR, `ucsd-buildings-${stamp()}.json`);
await writeJson(file, { sourceUrl: GIS_ROOT, retrievedAt: timestamp, metadata, points, footprints });
console.log(`Saved ${points.features.length} building points and ${footprints.features.length} footprints to ${path.relative(process.cwd(), file)}`);
