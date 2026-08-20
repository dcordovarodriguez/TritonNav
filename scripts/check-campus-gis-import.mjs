#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createCampusImportRun } = require("../lib/campus/import/importDataset.js");
const { createCampusCoverageReport } = require("../lib/campus/coverageReport.js");

const DEFAULT_MANIFEST = "data/campus/imports/manifest.example.json";
const manifestPath = resolve(process.cwd(), process.argv[2] || DEFAULT_MANIFEST);

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadDataset(manifestDir, dataset) {
  const datasetPath = resolve(manifestDir, dataset.path);

  if (!existsSync(datasetPath)) {
    return {
      ...dataset,
      input: { type: "FeatureCollection", features: [] },
      missing: true
    };
  }

  return {
    ...dataset,
    input: readJsonFile(datasetPath),
    missing: false
  };
}

if (!existsSync(manifestPath)) {
  console.error(`Campus GIS manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = readJsonFile(manifestPath);
const manifestDir = dirname(manifestPath);
const datasets = (manifest.datasets || []).map((dataset) => loadDataset(manifestDir, dataset));
const missingRequired = datasets.filter((dataset) => dataset.required && dataset.missing);

if (missingRequired.length) {
  console.error("Required campus GIS datasets are missing:");
  for (const dataset of missingRequired) {
    console.error(`- ${dataset.id}: ${dataset.path}`);
  }
  process.exit(1);
}

const run = createCampusImportRun({
  source: manifest.source,
  datasets
});
const coverage = createCampusCoverageReport();
const hasValidationErrors = run.previews.some((preview) => preview.validation.errors.length > 0);
const hasReviewItems = run.summary.review > 0;

console.log("Campus GIS import dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Datasets: ${run.datasetCount}`);
console.log(`Features: ${run.summary.features}`);
console.log(`Normalized: ${run.summary.normalized}`);
console.log(`Rejected: ${run.summary.rejected}`);
console.log(`Create: ${run.summary.create}`);
console.log(`Supersede: ${run.summary.supersede}`);
console.log(`Needs review: ${run.summary.review}`);
console.log("");
console.log("Current coverage snapshot");
console.log(`Buildings: ${coverage.buildings.discovered} discovered, ${coverage.buildings.verified} verified, ${coverage.buildings.provisional} provisional`);
console.log(`Entrances: ${coverage.entrances.total} total, ${coverage.entrances.verified} verified, ${coverage.entrances.accessible} marked accessible`);
console.log(`Housing colleges discovered: ${coverage.housing.discoveredColleges}/${coverage.housing.expectedColleges}`);
console.log(`Path import status: ${coverage.paths.officialCampusPathImportStatus}`);

for (const preview of run.previews) {
  if (!preview.validation.errors.length && !preview.validation.warnings.length) continue;
  console.log("");
  console.log(`${preview.id}:`);
  for (const warning of preview.validation.warnings) console.log(`  warning: ${warning}`);
  for (const error of preview.validation.errors) console.log(`  error: ${error}`);
}

if (hasValidationErrors || hasReviewItems) {
  process.exitCode = hasValidationErrors ? 1 : 0;
}
