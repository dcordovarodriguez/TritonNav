import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { GENERATED_DIR, latestFile, normalizeName, writeJson } from "./common.mjs";

const require = createRequire(import.meta.url);
const { CAMPUS_BUILDINGS } = require("../../data/campus/buildings.js");
const buildingPath = await latestFile("ucsd-buildings-", GENERATED_DIR, ".normalized.json");
const roomPath = await latestFile("ucsd-classrooms-", GENERATED_DIR);
const [buildingData, roomData] = await Promise.all([buildingPath, roomPath].map((file) => fs.readFile(file, "utf8").then(JSON.parse)));
const aliases = new Map();
for (const building of CAMPUS_BUILDINGS) {
  for (const name of [building.name, building.officialName, building.code, ...(building.aliases || [])].filter(Boolean)) {
    aliases.set(normalizeName(name), building.id);
  }
}
const links = roomData.rooms.map((room) => ({
  registrarCode: room.registrarCode,
  buildingName: room.buildingName,
  buildingId: aliases.get(normalizeName(room.buildingName)) || null,
  matchMethod: aliases.has(normalizeName(room.buildingName)) ? "exact-normalized-name-or-alias" : null,
  sourceUrl: room.sourceUrl,
  verified: Boolean(aliases.get(normalizeName(room.buildingName)))
}));
const output = path.join(GENERATED_DIR, `campus-room-building-links-${new Date().toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z")}.json`);
await writeJson(output, { generatedAt: new Date().toISOString(), links, unmatched: links.filter((link) => !link.buildingId) });
console.log(`Linked ${links.length - links.filter((link) => !link.buildingId).length}/${links.length} classrooms to current canonical buildings; no records were changed.`);
