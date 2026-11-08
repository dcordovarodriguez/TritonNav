import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { GENERATED_DIR, REPORT_DIR, latestFile, matchesExistingRoom, normalizeName, writeJson } from "./common.mjs";

const require = createRequire(import.meta.url);
const { CAMPUS_BUILDINGS } = require("../../data/campus/buildings.js");
const { CAMPUS_ROOMS } = require("../../data/campus/rooms.js");
const { CAMPUS_ENTRANCES } = require("../../data/campus/entrances.js");
const buildingFile = await latestFile("ucsd-buildings-", GENERATED_DIR, ".normalized.json");
const roomFile = await latestFile("ucsd-classrooms-", GENERATED_DIR);
const linkFile = await latestFile("campus-room-building-links-", GENERATED_DIR);
const [buildingData, roomData, linkData] = await Promise.all([buildingFile, roomFile, linkFile].map((file) => fs.readFile(file, "utf8").then(JSON.parse)));
const campusBounds = { south: 32.86, north: 32.90, west: -117.255, east: -117.22 };
const localBuildingNames = new Set(CAMPUS_BUILDINGS.flatMap((building) => [building.name, building.officialName, building.code, ...(building.aliases || [])].filter(Boolean).map(normalizeName)));
const core = buildingData.buildings.filter((building) => building.latitude >= campusBounds.south && building.latitude <= campusBounds.north && building.longitude >= campusBounds.west && building.longitude <= campusBounds.east);
const newBuildings = core.filter((building) => ![building.name, building.shortName, ...building.aliases].some((name) => localBuildingNames.has(normalizeName(name))));
const buildingByRegistrarCode = new Map(linkData.links.map((link) => [link.registrarCode, link.buildingId]));
const eligibleClassrooms = roomData.rooms.filter((room) => ["Classroom", "Lecture Hall"].includes(room.roomType) && room.registrarControlled === true && room.used === true);
const newClassrooms = eligibleClassrooms.filter((room) => !matchesExistingRoom(room, CAMPUS_ROOMS, buildingByRegistrarCode.get(room.registrarCode)));
const unmatched = linkData.links.filter((link) => !link.buildingId);
const checkedAt = new Date().toISOString();
const sourceMeta = { checkedAt, campusBounds, officialBuildingSource: buildingData.sourceUrl, classroomSource: roomData.sourceUrl, mediaSource: roomData.mediaSourceUrl, policy: "comparison only; repository data is never overwritten" };

const newBuildingReport = { ...sourceMeta, currentRepoBuildingCount: CAMPUS_BUILDINGS.length, officialBuildingPointCount: buildingData.count, coreEnvelopeCandidateCount: core.length, newCandidateCount: newBuildings.length, newOperationalCount: newBuildings.filter((item) => item.operationalStatus === "operational").length, candidates: newBuildings };
const classroomReport = { ...sourceMeta, currentRepoRoomCount: CAMPUS_ROOMS.length, officialFacilitiesRoomRowCount: roomData.rooms.length, officialRegistrarControlledClassroomCount: eligibleClassrooms.length, newClassroomCount: newClassrooms.length, newClassrooms };
await Promise.all([
  writeJson(path.join(REPORT_DIR, "new-buildings.json"), newBuildingReport),
  writeJson(path.join(REPORT_DIR, "classroom-diff.json"), classroomReport),
  writeJson(path.join(REPORT_DIR, "unmatched-classrooms.json"), { ...sourceMeta, count: unmatched.length, classrooms: unmatched })
]);

function table(rows, fields) {
  return [fields.join(" | "), fields.map(() => "---").join(" | "), ...rows.map((row) => fields.map((field) => String(row[field] ?? "—").replaceAll("|", "\\|")).join(" | "))].join("\n");
}
const priorityRooms = roomData.rooms.filter((room) => /^(Brian C\. Malk Hall|Coalition)$/i.test(room.buildingName));
const roomSummary = {
  sourceRows: priorityRooms.length,
  classrooms: priorityRooms.filter((room) => room.roomType === "Classroom").length,
  lectureHalls: priorityRooms.filter((room) => /lecture hall/i.test(room.roomType || "")).length,
  capacityKnown: priorityRooms.filter((room) => room.capacity !== null && room.capacity > 0).length,
  accessibilityDataKnown: priorityRooms.filter((room) => room.accessibleSeatingKnown).length,
  mediaData: priorityRooms.filter((room) => Object.keys(room.technology).length > 0).length
};
const ridge = [
  `# Ridge Walk North classroom inventory`,
  ``,
  `Source checked: ${checkedAt}. This report reflects the current public UCSD Facilities export; it does not classify or locate rooms beyond the source data.`,
  ``,
  `Buildings: Brian C. Malk Hall; Coalition. Source rows: ${roomSummary.sourceRows}. Room type counts: ${roomSummary.classrooms} Classroom, ${roomSummary.lectureHalls} Lecture Hall. Positive capacity: ${roomSummary.capacityKnown}. Accessibility fields present: ${roomSummary.accessibilityDataKnown}. Media rows with metadata: ${roomSummary.mediaData}.`,
  ``,
  `The Facilities export currently groups 19 records under these two building names. Its room types and counts do not match a simple “19 general assignment classrooms plus one lecture hall” interpretation; the records are listed exactly as published for human reconciliation.`,
  ``,
  table(priorityRooms.map((room) => ({ building: room.buildingName, room: room.registrarCode, type: room.roomType, capacity: room.capacity, floor: room.floor, code: room.registrarCode, wheelchair: room.wheelchairSeats, technology: Object.entries(room.technology).map(([key, value]) => `${key}: ${value}`).join("; "), source: room.sourceUrl })), ["building", "room", "type", "capacity", "floor", "code", "wheelchair", "technology", "source"]),
  ``,
  `No room coordinates or indoor routes are inferred. Current TritonNav campus buildings: ${CAMPUS_BUILDINGS.length}; rooms: ${CAMPUS_ROOMS.length}; entrances: ${CAMPUS_ENTRANCES.length}.`
].join("\n");
await fs.mkdir(REPORT_DIR, { recursive: true });
await fs.writeFile(path.join(REPORT_DIR, "ridge-walk-north-classrooms.md"), `${ridge}\n`);
await fs.writeFile(path.join(REPORT_DIR, "new-buildings.md"), `# UCSD building comparison\n\nChecked ${checkedAt}. Official point layer has ${buildingData.count} records. The broad campus-core envelope yields ${core.length} candidates; ${newBuildings.length} do not match current TritonNav building names or aliases (${newBuildingReport.newOperationalCount} marked Operational by GIS). These are review candidates, not verified additions.\n\n${table(newBuildings.slice(0, 100).map((item) => ({ name: item.name, stage: item.lifecycleStage, address: item.address, latitude: item.latitude, longitude: item.longitude })), ["name", "stage", "address", "latitude", "longitude"])}\n`);
await fs.writeFile(path.join(REPORT_DIR, "classroom-diff.md"), `# UCSD classroom comparison\n\nChecked ${checkedAt}. Public Facilities workbook contains ${roomData.rooms.length} room rows, of which ${eligibleClassrooms.length} are marked both Registrar controlled and in use as a Classroom or Lecture Hall. TritonNav currently has ${CAMPUS_ROOMS.length} room records. ${newClassrooms.length} eligible official classroom rows do not match current local room names. This is a review queue, not an instruction to import every Registrar room.\n\n${table(newClassrooms.slice(0, 100).map((room) => ({ building: room.buildingName, room: room.registrarCode, type: room.roomType, capacity: room.capacity, floor: room.floor })), ["building", "room", "type", "capacity", "floor"])}\n`);
  console.log(JSON.stringify({ officialBuildingPoints: buildingData.count, campusCoreCandidates: core.length, unmatchedBuildingCandidates: newBuildings.length, operationalCandidates: newBuildingReport.newOperationalCount, officialRoomRows: roomData.rooms.length, registrarControlledClassrooms: eligibleClassrooms.length, newClassrooms: newClassrooms.length, unmatchedBuildingLinks: unmatched.length, ridgeWalkNorth: roomSummary, reports: ["new-buildings.json", "new-buildings.md", "classroom-diff.json", "classroom-diff.md", "unmatched-classrooms.json", "ridge-walk-north-classrooms.md"] }, null, 2));
