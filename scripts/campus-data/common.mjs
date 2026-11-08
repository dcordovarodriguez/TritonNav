import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const RAW_DIR = path.join(ROOT, "data/campus/imports/raw/ucsd");
export const GENERATED_DIR = path.join(ROOT, "data/campus/imports/generated/ucsd");
export const REPORT_DIR = path.join(ROOT, "reports");
export const GIS_ROOT = "https://admin-enterprise-gis.ucsd.edu/server/rest/services/Buildings/Buildings_Campus_Map/MapServer";
export const CLASSROOM_URL = "https://facilities.ucsd.edu/NA/ClassroomAttributes/ClassroomAttributes.xls";
export const CLASSROOM_PAGE = "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes";
export const MEDIA_PAGE = "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?View=MediaEquipment";

export async function ensureDir(directory) {
  await fs.mkdir(directory, { recursive: true });
}

export function stamp(date = new Date()) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

export async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "TritonNav-campus-data-audit/1.0" } });
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  return response.text();
}

export async function fetchJson(url) {
  const text = await fetchText(url);
  const value = JSON.parse(text);
  if (value.error) throw new Error(`UCSD GIS error: ${value.error.message || JSON.stringify(value.error)}`);
  return value;
}

export async function writeJson(file, value) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function latestFile(prefix, directory = RAW_DIR, extension = ".json") {
  const names = (await fs.readdir(directory)).filter((name) => name.startsWith(prefix) && name.endsWith(extension)).sort();
  if (!names.length) throw new Error(`No ${prefix}*${extension} snapshot in ${directory}; run its fetch script first.`);
  return path.join(directory, names.at(-1));
}

export function decodeXml(value = "") {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function xmlCellIndex(openingTag, nextIndex) {
  const explicit = openingTag.match(/\bss:Index=["'](\d+)["']/i);
  return explicit ? Number(explicit[1]) - 1 : nextIndex;
}

export function parseSpreadsheetXml(xml) {
  const sheets = [];
  const sheetPattern = /<Worksheet\b([^>]*)>([\s\S]*?)<\/Worksheet>/gi;
  for (const match of xml.matchAll(sheetPattern)) {
    const name = match[1].match(/\bss:Name=["']([^"']+)["']/i)?.[1] || "";
    const rows = [];
    for (const rowMatch of match[2].matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/gi)) {
      const cells = [];
      let nextIndex = 0;
      for (const cellMatch of rowMatch[1].matchAll(/<Cell\b([^>]*)>([\s\S]*?)<\/Cell>/gi)) {
        const index = xmlCellIndex(cellMatch[1], nextIndex);
        const data = cellMatch[2].match(/<Data\b[^>]*>([\s\S]*?)<\/Data>/i)?.[1] || "";
        cells[index] = decodeXml(data);
        nextIndex = index + 1;
      }
      rows.push(cells.map((cell) => cell ?? ""));
    }
    sheets.push({ name, rows });
  }
  return sheets;
}

export function sheetObjects(sheet) {
  if (!sheet?.rows?.length) return [];
  const headers = sheet.rows[0].map((header) => header.trim());
  return sheet.rows.slice(1).filter((row) => row.some(Boolean)).map((row) =>
    Object.fromEntries(headers.map((header, index) => header ? [header, row[index] || ""] : null).filter(Boolean))
  );
}

export function normalizeName(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

// A bare room number is only meaningful within a canonical building.
export function matchesExistingRoom(room, existingRooms, buildingId = null) {
  const qualifiedNames = [room.registrarCode, `${room.buildingName} ${room.room}`]
    .filter(Boolean).map(normalizeName);
  return existingRooms.some((existing) =>
    [existing.name, existing.id].filter(Boolean).some((name) => qualifiedNames.includes(normalizeName(name)))
    || (buildingId && existing.buildingId === buildingId
      && normalizeName(existing.number) === normalizeName(room.room))
  );
}

export function arcgisField(properties, suffix) {
  const entry = Object.entries(properties || {}).find(([name]) => name.endsWith(suffix));
  return entry?.[1] ?? null;
}

export function parseBoolean(value) {
  if (/^yes$/i.test(String(value).trim())) return true;
  if (/^no$/i.test(String(value).trim())) return false;
  return null;
}
