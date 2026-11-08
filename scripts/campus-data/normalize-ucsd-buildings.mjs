import fs from "node:fs/promises";
import path from "node:path";
import { GENERATED_DIR, RAW_DIR, arcgisField, latestFile, writeJson } from "./common.mjs";

const snapshotPath = await latestFile("ucsd-buildings-", RAW_DIR);
const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
const footprints = new Map((snapshot.footprints.features || []).map((feature) => [
  String(arcgisField(feature.properties, "FacilityID") ?? ""), feature.geometry
]));
const buildings = (snapshot.points.features || []).map((feature) => {
  const properties = feature.properties || {};
  const facilityId = String(arcgisField(properties, "FacilityID") ?? "");
  const [longitude, latitude] = feature.geometry?.coordinates || [];
  const lifecycle = String(arcgisField(properties, "LifecycleStage") || "").toLowerCase();
  const operationalStatus = lifecycle === "operational" ? "operational"
    : lifecycle === "construction" ? "construction"
    : lifecycle === "planning" ? "planned"
    : lifecycle === "closed" ? "closed" : "unknown";
  return {
    facilityId,
    name: arcgisField(properties, "FacilityLongName"),
    shortName: arcgisField(properties, "FacilityShortName"),
    aliases: String(arcgisField(properties, "BuildingAliases") || "").split("|").map((value) => value.trim()).filter(Boolean),
    address: arcgisField(properties, "StreetAddress"),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    geometry: feature.geometry || null,
    footprint: footprints.get(facilityId) || null,
    lifecycleStage: arcgisField(properties, "LifecycleStage"),
    facilityStatus: arcgisField(properties, "FacilityStatus"),
    operationalStatus,
    source: "UC San Diego Facilities GIS",
    sourceUrl: snapshot.sourceUrl,
    sourceType: "official-gis",
    sourceCheckedAt: snapshot.retrievedAt,
    verified: true,
    confidence: "official-source; lifecycle status may need reconciliation with newer operational announcements"
  };
}).filter((building) => building.name);
const output = path.join(GENERATED_DIR, path.basename(snapshotPath).replace(".json", ".normalized.json"));
await writeJson(output, { retrievedAt: snapshot.retrievedAt, sourceUrl: snapshot.sourceUrl, count: buildings.length, buildings });
console.log(`Normalized ${buildings.length} buildings to ${path.relative(process.cwd(), output)}`);
