import fs from "node:fs/promises";
import path from "node:path";
import { CLASSROOM_PAGE, GENERATED_DIR, MEDIA_PAGE, RAW_DIR, latestFile, parseBoolean, parseSpreadsheetXml, sheetObjects, writeJson } from "./common.mjs";

const classroomPath = await latestFile("ucsd-classrooms-", RAW_DIR, ".xml");
const mediaPath = await latestFile("ucsd-classroom-media-", RAW_DIR, ".xml");
const [classroomXml, mediaXml] = await Promise.all([fs.readFile(classroomPath, "utf8"), fs.readFile(mediaPath, "utf8")]);
const classroomSheet = parseSpreadsheetXml(classroomXml).find((sheet) => sheet.name === "Classroom Attributes");
const mediaSheet = parseSpreadsheetXml(mediaXml).find((sheet) => sheet.name === "Media Equipment");
if (!classroomSheet || !mediaSheet) throw new Error("Expected Classroom Attributes and Media Equipment worksheets.");
const mediaByRegistrarCode = new Map(sheetObjects(mediaSheet).map((row) => [row["Registrar Code"], row]));
const asNumberOrNull = (value) => value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const rooms = sheetObjects(classroomSheet).map((row) => {
  const media = mediaByRegistrarCode.get(row["Registrar Code"]) || {};
  const mediaKeys = ["Media Control", "Players", "Inputs", "VDC", "Voice Amplification", "Projector", "Screen Type", "Screen Width", "Video Display", "Zoom Capable", "Podcasting", "i>clicker", "Close Caption Decoder/ Assisted Listening Devices (By Request)", "Network"];
  const technology = Object.fromEntries(mediaKeys.filter((key) => media[key]).map((key) => [key, media[key]]));
  return {
    buildingName: row["Building Name"],
    room: row.Room,
    registrarCode: row["Registrar Code"],
    floor: row.Floor || null,
    areaSqFt: asNumberOrNull(row.Area),
    capacity: asNumberOrNull(row.Capacity),
    roomType: row["Room Type"] || null,
    registrarControlled: parseBoolean(row["Controlled by Registrar"]),
    used: parseBoolean(row.Used),
    overflowCapable: parseBoolean(row["Overflow Capable"]),
    seatingType: row["Seating Type"] || null,
    wheelchairSeats: asNumberOrNull(row["Wheelchair Spaces"]),
    accessibleSeatingKnown: row["Wheelchair Spaces"] !== "",
    physicalAttributes: Object.fromEntries(Object.entries(row).filter(([key, value]) => value && !["Building Name", "Room", "Registrar Code", "Floor", "Area", "Capacity", "Room Type", "Controlled by Registrar", "Used", "Overflow Capable", "Seating Type", "Wheelchair Spaces"].includes(key))),
    technology,
    source: "UC San Diego Facilities Information System",
    sourceUrl: CLASSROOM_PAGE,
    mediaSourceUrl: MEDIA_PAGE,
    sourceType: "official-public-classroom-export",
    sourceCheckedAt: new Date().toISOString(),
    verified: true,
    confidence: "official public facilities dataset"
  };
}).filter((room) => room.registrarCode);
const output = path.join(GENERATED_DIR, `ucsd-classrooms-${new Date().toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z")}.json`);
await writeJson(output, { sourceUrl: CLASSROOM_PAGE, mediaSourceUrl: MEDIA_PAGE, classroomWorksheetRows: classroomSheet.rows.length - 1, mediaWorksheetRows: mediaSheet.rows.length - 1, rooms });
console.log(`Normalized ${rooms.length} rooms; joined ${rooms.filter((room) => Object.keys(room.technology).length).length} media records to ${path.relative(process.cwd(), output)}`);
