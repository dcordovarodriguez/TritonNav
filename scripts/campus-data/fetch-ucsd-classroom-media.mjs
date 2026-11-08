import path from "node:path";
import { CLASSROOM_URL, RAW_DIR, ensureDir, fetchText, stamp } from "./common.mjs";
import fs from "node:fs/promises";

// UCSD serves both workbook views at this public export URL. Save the media view separately
// for explicit provenance; normalization joins it by the Registrar Code.
const retrievedAt = new Date().toISOString();
const workbookXml = await fetchText(CLASSROOM_URL);
if (!workbookXml.includes("Media Equipment")) throw new Error("The public export did not contain its Media Equipment worksheet.");
await ensureDir(RAW_DIR);
const file = path.join(RAW_DIR, `ucsd-classroom-media-${stamp()}.xml`);
await fs.writeFile(file, workbookXml);
console.log(`Saved public classroom/media workbook (${workbookXml.length} characters) to ${path.relative(process.cwd(), file)} at ${retrievedAt}`);
