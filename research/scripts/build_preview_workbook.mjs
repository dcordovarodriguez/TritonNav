import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(import.meta.dirname, "../..");
const dataPath = path.join(root, "research/data/preview_tables.json");
const outputDir = path.join(root, "research/previews");
const outputPath = path.join(outputDir, "TritonNav_Field_Test_Analysis_Preview.xlsx");
const tables = JSON.parse(await fs.readFile(dataPath, "utf8"));

const workbook = Workbook.create();
const dark = "#17324D";
const light = "#EAF1F7";
const amber = "#FFF4CC";
const border = "#CBD5E1";

for (const [sheetName, table] of Object.entries(tables)) {
  const sheet = workbook.worksheets.add(sheetName.slice(0, 31));
  const columnCount = table.columns.length;
  const rowCount = table.rows.length;

  sheet.showGridLines = false;
  sheet.getCell(0, 0).values = [[sheetName]];
  sheet.getCell(0, 0).format.font = { name: "Arial", size: 15, bold: true, color: dark };
  sheet.getCell(0, 0).format.rowHeight = 25;

  sheet.getCell(1, 0).values = [[
    "Approval preview. Source observations are preserved; calculated and modeled values are labeled explicitly."
  ]];
  sheet.getCell(1, 0).format.font = { name: "Arial", size: 9, italic: true, color: "#475569" };
  sheet.getCell(1, 0).format.rowHeight = 22;

  const header = sheet.getRangeByIndexes(3, 0, 1, columnCount);
  header.values = [table.columns];
  header.format.fill = dark;
  header.format.font = { name: "Arial", size: 9, bold: true, color: "#FFFFFF" };
  header.format.horizontalAlignment = "center";
  header.format.verticalAlignment = "center";
  header.format.wrapText = true;
  header.format.rowHeight = 31;
  header.format.borders = { preset: "inside", style: "thin", color: "#FFFFFF" };

  if (rowCount > 0) {
    const body = sheet.getRangeByIndexes(4, 0, rowCount, columnCount);
    body.values = table.rows;
    body.format.font = { name: "Arial", size: 9, color: "#1F2937" };
    body.format.verticalAlignment = "top";
    body.format.wrapText = true;
    body.format.borders = {
      insideHorizontal: { style: "thin", color: border },
      bottom: { style: "thin", color: border }
    };

    for (let row = 0; row < rowCount; row += 2) {
      sheet.getRangeByIndexes(4 + row, 0, 1, columnCount).format.fill = "#F8FAFC";
    }

    const approvalIndex = table.columns.indexOf("approval_status");
    if (approvalIndex >= 0) {
      sheet.getRangeByIndexes(4, approvalIndex, rowCount, 1).format.fill = amber;
    }

    for (let col = 0; col < columnCount; col++) {
      const heading = String(table.columns[col]).toLowerCase();
      if (/minutes|mean|median|error|estimate|value|count|\bn\b|trial_id|route_id|source_row/.test(heading)) {
        sheet.getRangeByIndexes(4, col, rowCount, 1).setNumberFormat("0.00");
      }
    }
  }

  for (let col = 0; col < columnCount; col++) {
    const heading = String(table.columns[col]);
    const values = table.rows.map((row) => row[col]);
    const maxLength = Math.max(
      heading.length,
      ...values.slice(0, 100).map((value) => String(value ?? "").length)
    );
    const width = Math.min(42, Math.max(11, Math.ceil(maxLength * 0.85)));
    sheet.getRangeByIndexes(0, col, Math.max(rowCount + 4, 5), 1).format.columnWidth = width;
  }

  sheet.freezePanes.freezeRows(4);
}

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

for (const sheetName of ["Dataset Overview", "Proposed Estimates", "Summary Statistics"]) {
  const image = await workbook.render({ sheetName, autoCrop: "all", scale: 1.25, format: "png" });
  await fs.writeFile(
    path.join(outputDir, `qa-${sheetName.toLowerCase().replaceAll(" ", "-")}.png`),
    new Uint8Array(await image.arrayBuffer())
  );
}

const overview = await workbook.inspect({
  kind: "table",
  sheetId: "Dataset Overview",
  range: "A1:C20",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
  maxChars: 6000
});
console.log(overview.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan"
});
console.log(errors.ndjson);
console.log(`Saved ${outputPath}`);
