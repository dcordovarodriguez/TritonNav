#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  INDOOR_BUILDINGS,
  INDOOR_EDGES,
  INDOOR_FLOORS,
  INDOOR_NODES,
  INDOOR_SPACES,
  createIndoorCoverageReport,
  validateIndoorDataset
} = require("../lib/campus/indoor/index.js");

const validation = validateIndoorDataset({
  buildings: INDOOR_BUILDINGS,
  floors: INDOOR_FLOORS,
  spaces: INDOOR_SPACES,
  nodes: INDOOR_NODES,
  edges: INDOOR_EDGES
});
const coverage = createIndoorCoverageReport();

if (!validation.valid) {
  console.error("Indoor data validation failed.");
  for (const error of validation.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Indoor data validation passed.");
console.log(`Proof of concept building: ${coverage.proofOfConceptBuildingId}`);
console.log(`Buildings with indoor metadata: ${coverage.buildingsWithIndoorMetadata}`);
console.log(`Buildings with indoor graph: ${coverage.buildingsWithIndoorGraph}`);
console.log(`Floors represented: ${coverage.floorsRepresented}`);
console.log(`Rooms represented: ${coverage.roomsRepresented}`);
console.log(`Outdoor entrances connected to indoor nodes: ${coverage.outdoorEntrancesConnectedToIndoorNodes}`);
console.log(`Geisel transfer node present: ${coverage.geisel.outdoorEntranceTransferNode}`);
