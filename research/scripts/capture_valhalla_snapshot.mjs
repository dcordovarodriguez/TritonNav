import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  resolveDestinationToRoutableCoordinateDetails
} = require("../../lib/campus/resolver.js");

const root = path.resolve(import.meta.dirname, "../..");
const inputPath = path.join(root, "research/data/missing_route_candidates.json");
const outputPath = path.join(root, "research/data/current_valhalla_snapshot.json");
const apiUrl = process.env.TRITONNAV_ANALYSIS_API_URL || "http://127.0.0.1:3000/api/routes/walking";

const candidates = JSON.parse(await fs.readFile(inputPath, "utf8"));
const capturedAt = new Date().toISOString();
const results = [];

for (const candidate of candidates) {
  const origin = resolveDestinationToRoutableCoordinateDetails(candidate.origin);
  const destination = resolveDestinationToRoutableCoordinateDetails(candidate.destination);
  const result = {
    ...candidate,
    capturedAt,
    originCoordinate: origin?.coordinate || null,
    destinationCoordinate: destination?.coordinate || null,
    status: null,
    provider: null,
    isEstimated: null,
    distanceMeters: null,
    durationSeconds: null,
    errorCode: null,
    errorMessage: null
  };

  if (!origin || !destination) {
    result.errorCode = "UNRESOLVED_DESTINATION";
    result.errorMessage = "The current campus resolver could not resolve both endpoints.";
    results.push(result);
    continue;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: {
          latitude: origin.coordinate.lat,
          longitude: origin.coordinate.lng
        },
        destination: {
          latitude: destination.coordinate.lat,
          longitude: destination.coordinate.lng
        }
      })
    });
    const body = await response.json();
    result.status = response.status;
    result.provider = body.provider || null;
    result.isEstimated = body.isEstimated ?? null;
    result.distanceMeters = body.distanceMeters ?? null;
    result.durationSeconds = body.durationSeconds ?? null;
    result.errorCode = body.error?.code || null;
    result.errorMessage = body.error?.message || null;
  } catch (error) {
    result.errorCode = "REQUEST_FAILED";
    result.errorMessage = String(error?.message || error);
  }

  results.push(result);
}

await fs.writeFile(
  outputPath,
  `${JSON.stringify({ capturedAt, apiUrl: "local TritonNav internal API", results }, null, 2)}\n`,
  "utf8"
);
console.log(`Wrote ${results.length} route checks to ${outputPath}`);
