import path from "node:path";
import { CLASSROOM_URL, RAW_DIR, fetchText, stamp, writeJson } from "./common.mjs";

const retrievedAt = new Date().toISOString();
const workbookXml = await fetchText(CLASSROOM_URL);
if (!workbookXml.includes("SpreadsheetML") && !workbookXml.includes("urn:schemas-microsoft-com:office:spreadsheet")) {
  throw new Error("The public classroom export did not return the expected Excel SpreadsheetML format.");
}
const file = path.join(RAW_DIR, `ucsd-classrooms-${stamp()}.xml`);
const { ensureDir } = await import("./common.mjs");
await ensureDir(RAW_DIR);
await import("node:fs/promises").then(({ writeFile }) => writeFile(file, workbookXml));
console.log(`Saved public classroom workbook (${workbookXml.length} characters) to ${path.relative(process.cwd(), file)} at ${retrievedAt}`);
