#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROUTE_ERROR_CODES, RoutingError } from "../lib/routing/routeModel.mjs";
import { requestValhallaWalkingRoute } from "../services/routing/valhallaProvider.mjs";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const GEISEL_LIBRARY = { latitude: 32.88114, longitude: -117.23758 };
const PRICE_CENTER = { latitude: 32.8798, longitude: -117.23695 };

function loadLocalEnv() {
  if (!existsSync(ENV_FILE)) return;

  const contents = readFileSync(ENV_FILE, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  console.error(`Valhalla health check failed: ${message}`);
  process.exitCode = 1;
}

function validateConfiguration() {
  const hasBaseUrl = Boolean(process.env.VALHALLA_BASE_URL);
  const hasApiKey = Boolean(process.env.VALHALLA_API_KEY);
  const hasApiKeyHeader = Boolean(process.env.VALHALLA_API_KEY_HEADER);

  if (!hasBaseUrl) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION,
      "VALHALLA_BASE_URL is not configured."
    );
  }

  if (hasApiKey !== hasApiKeyHeader) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION,
      "VALHALLA_API_KEY and VALHALLA_API_KEY_HEADER must be configured together for header authentication."
    );
  }
}

loadLocalEnv();

try {
  validateConfiguration();

  const route = await requestValhallaWalkingRoute({
    origin: GEISEL_LIBRARY,
    destination: PRICE_CENTER
  });

  const hasValidResponse =
    route.provider === "valhalla" &&
    route.isEstimated === false &&
    route.geometry?.type === "LineString" &&
    route.geometry.coordinates.length >= 2 &&
    Number.isFinite(route.distanceMeters) &&
    route.distanceMeters > 0 &&
    Number.isFinite(route.durationSeconds) &&
    route.durationSeconds > 0;

  if (!hasValidResponse) {
    fail("provider response did not include a valid trip, shape, distance, and duration.");
  } else {
    console.log("Valhalla health check passed.");
    console.log("Status: ok");
    console.log(`Provider: ${route.provider}`);
    console.log(`Geometry coordinates: ${route.geometry.coordinates.length}`);
    console.log(`Distance meters: ${route.distanceMeters}`);
    console.log(`Duration seconds: ${route.durationSeconds}`);
    console.log(`Maneuver steps: ${route.steps.length}`);
  }
} catch (error) {
  fail(`${error.code || "ERROR"} - ${error.message || "route request failed"}`);
}
