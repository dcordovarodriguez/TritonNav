import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { CAMPUS_BUILDINGS } = require("../../data/campus/buildings.js");
const { CAMPUS_ROOMS } = require("../../data/campus/rooms.js");
const { CAMPUS_ENTRANCES } = require("../../data/campus/entrances.js");
const { CAMPUS_COLLEGES } = require("../../data/campus/colleges.js");

const problems = [];
const warnings = [];
const checks = [];
function check(condition, message) { checks.push({ condition: Boolean(condition), message }); if (!condition) problems.push(message); }
function uniqueIds(records, label) { const ids = records.map((item) => item.id); check(new Set(ids).size === ids.length, `${label} IDs must be unique`); }
function validCoordinate(lat, lng) { return lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Number(lat) >= -90 && Number(lat) <= 90 && Number(lng) >= -180 && Number(lng) <= 180; }
uniqueIds(CAMPUS_BUILDINGS, "Building"); uniqueIds(CAMPUS_ROOMS, "Room"); uniqueIds(CAMPUS_ENTRANCES, "Entrance");
const buildingIds = new Set(CAMPUS_BUILDINGS.map((item) => item.id));
const entranceIds = new Set(CAMPUS_ENTRANCES.map((item) => item.id));
for (const item of CAMPUS_BUILDINGS) if (item.centroid) check(validCoordinate(item.centroid.lat, item.centroid.lng), `Invalid building coordinates: ${item.id}`);
for (const item of CAMPUS_ENTRANCES) check(validCoordinate(item.coordinates?.lat, item.coordinates?.lng), `Invalid entrance coordinates: ${item.id}`);
for (const item of CAMPUS_ENTRANCES) check(buildingIds.has(item.buildingId), `Entrance references missing building: ${item.id} -> ${item.buildingId}`);
for (const item of CAMPUS_ROOMS) {
  check(buildingIds.has(item.buildingId), `Room references missing building: ${item.id} -> ${item.buildingId}`);
  if (item.preferredEntranceId) check(entranceIds.has(item.preferredEntranceId), `Room references missing entrance: ${item.id} -> ${item.preferredEntranceId}`);
}
const aliases = new Map();
for (const item of [...CAMPUS_BUILDINGS, ...CAMPUS_COLLEGES]) for (const alias of item.aliases || []) {
  const key = alias.trim().toLowerCase();
  if (aliases.has(key) && aliases.get(key) !== item.id) warnings.push(`Alias collision: ${alias} (${aliases.get(key)}, ${item.id})`);
  else aliases.set(key, item.id);
}
const expectedColleges = ["Revelle College", "John Muir College", "Thurgood Marshall College", "Eleanor Roosevelt College", "Warren College", "Sixth College", "Seventh College", "Eighth College"];
const collegeNames = new Set(CAMPUS_COLLEGES.map((item) => item.name));
check(expectedColleges.every((name) => collegeNames.has(name)), "All eight UCSD undergraduate colleges must be represented");
for (const item of CAMPUS_BUILDINGS) {
  const url = item.source?.sourceUrl || item.source?.url;
  if (url) check(/^https:\/\//i.test(url), `Building source URL must use HTTPS: ${item.id}`);
}
function distanceMeters(a, b) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat); const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
const locatedBuildings = CAMPUS_BUILDINGS.filter((item) => validCoordinate(item.centroid?.lat, item.centroid?.lng));
for (let i = 0; i < locatedBuildings.length; i += 1) for (let j = i + 1; j < locatedBuildings.length; j += 1) {
  if (distanceMeters(locatedBuildings[i].centroid, locatedBuildings[j].centroid) < 1) warnings.push(`Building centroids within 1m: ${locatedBuildings[i].id}, ${locatedBuildings[j].id}`);
}
console.log(JSON.stringify({ buildingCount: CAMPUS_BUILDINGS.length, roomCount: CAMPUS_ROOMS.length, entranceCount: CAMPUS_ENTRANCES.length, collegeCount: CAMPUS_COLLEGES.length, checks: checks.length, warnings, problems }, null, 2));
if (problems.length) process.exitCode = 1;
