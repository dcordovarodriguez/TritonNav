import test from "node:test";
import assert from "node:assert/strict";
import { matchesExistingRoom, normalizeName, parseBoolean, parseSpreadsheetXml, sheetObjects } from "../scripts/campus-data/common.mjs";

test("parses UCSD SpreadsheetML sheets and aligned row fields", () => {
  const xml = `<Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Classroom Attributes"><Table><Row><Cell><Data ss:Type="String">Building Name</Data></Cell><Cell><Data ss:Type="String">Room</Data></Cell><Cell ss:Index="4"><Data ss:Type="String">Capacity</Data></Cell></Row><Row><Cell><Data ss:Type="String">Brian C. Malk Hall</Data></Cell><Cell><Data ss:Type="String">MALK B90</Data></Cell><Cell ss:Index="4"><Data ss:Type="Number">58</Data></Cell></Row></Table></Worksheet></Workbook>`;
  const sheets = parseSpreadsheetXml(xml);
  const rows = sheetObjects(sheets[0]);
  assert.deepEqual(rows[0], { "Building Name": "Brian C. Malk Hall", Room: "MALK B90", Capacity: "58" });
});

test("normalizes official building spelling and punctuation for matching", () => {
  assert.equal(normalizeName("Brian C Malk Hall"), normalizeName("Brian C. Malk Hall"));
  assert.equal(normalizeName("Thurgood Marshall College"), "thurgood marshall college");
});

test("preserves unknown yes/no values as unknown", () => {
  assert.equal(parseBoolean("Yes"), true);
  assert.equal(parseBoolean("No"), false);
  assert.equal(parseBoolean("N/A"), null);
});

test("room matching never treats a shared number in different buildings as the same room", () => {
  const existing = [{ id: "csb-100", name: "CSB 100", buildingId: "csb", number: "100" }];
  const other = { registrarCode: "COA 100", buildingName: "Coalition", room: "100" };
  assert.equal(matchesExistingRoom(other, existing, "coalition"), false);
  assert.equal(matchesExistingRoom(other, existing), false);
  assert.equal(matchesExistingRoom({ ...other, registrarCode: "CSB 100" }, existing), true);
  assert.equal(matchesExistingRoom({ ...other, buildingName: "Cognitive Science Building" }, existing, "csb"), true);
});
