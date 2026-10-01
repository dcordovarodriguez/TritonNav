#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RoutingError, ROUTE_ERROR_CODES } from "../lib/routing/routeModel.mjs";
import { getValhallaConfiguration, requestValhallaWalkingRoute } from "../services/routing/valhallaProvider.mjs";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const GEISEL_LIBRARY = { latitude: 32.88114, longitude: -117.23758 };
const PRICE_CENTER = { latitude: 32.8798, longitude: -117.23695 };
const REQUIRE_REMOTE = process.argv.includes("--require-remote");

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

function isLoopbackHost(hostname) {
  return ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(hostname);
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function classifyEndpoint(routeUrl) {
  const url = new URL(routeUrl);
  if (isLoopbackHost(url.hostname)) return "local-loopback";
  if (isPrivateIpv4(url.hostname)) return "private-network";
  if (url.protocol === "https:") return "remote-https";
  return "remote-http";
}

function fail(message) {
  console.error(`Production routing check failed: ${message}`);
  process.exitCode = 1;
}

loadLocalEnv();

try {
  const configuration = getValhallaConfiguration();
  const endpointCategory = classifyEndpoint(configuration.url);
  const hasHeaderAuth = Boolean(configuration.apiKey && configuration.apiKeyHeader);

  console.log("Production routing readiness check");
  console.log(`Endpoint category: ${endpointCategory}`);
  console.log(`Header authentication configured: ${hasHeaderAuth ? "yes" : "no"}`);

  if (endpointCategory === "local-loopback") {
    console.log("Vercel production reachable: no");
    console.log("Reason: loopback endpoints only resolve inside the Vercel function runtime, not to this Mac.");
    if (REQUIRE_REMOTE) {
      throw new RoutingError(
        ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION,
        "A remote Valhalla endpoint is required for production readiness."
      );
    }
  } else if (endpointCategory === "remote-http") {
    console.log("Vercel production reachable: maybe");
    console.log("Warning: public production routing should use HTTPS or private connectivity.");
  } else {
    console.log("Vercel production reachable: depends on firewall, DNS, and provider health.");
  }

  const route = await requestValhallaWalkingRoute({
    origin: GEISEL_LIBRARY,
    destination: PRICE_CENTER
  });

  const hasValidRoute =
    route.provider === "valhalla" &&
    route.isEstimated === false &&
    route.geometry?.type === "LineString" &&
    route.geometry.coordinates.length >= 2 &&
    Number.isFinite(route.distanceMeters) &&
    route.distanceMeters > 0 &&
    Number.isFinite(route.durationSeconds) &&
    route.durationSeconds > 0;

  if (!hasValidRoute) {
    fail("provider response did not include a valid Valhalla route.");
  } else {
    console.log("Route smoke test: passed");
    console.log(`Provider: ${route.provider}`);
    console.log(`Estimated: ${route.isEstimated}`);
    console.log(`Geometry coordinates: ${route.geometry.coordinates.length}`);
    console.log(`Distance meters: ${route.distanceMeters}`);
    console.log(`Duration seconds: ${route.durationSeconds}`);
  }
} catch (error) {
  fail(`${error.code || "ERROR"} - ${error.message || "routing readiness check failed"}`);
}
