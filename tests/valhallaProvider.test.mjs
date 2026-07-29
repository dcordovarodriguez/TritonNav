import assert from "node:assert/strict";
import test from "node:test";
import {
  ROUTE_ERROR_CODES,
  RoutingError
} from "../lib/routing/routeModel.mjs";
import {
  buildValhallaRouteUrl,
  decodeValhallaShape,
  normalizeValhallaRouteResponse,
  requestValhallaWalkingRoute
} from "../services/routing/valhallaProvider.mjs";

function encodePolyline6(points) {
  let lastLatitude = 0;
  let lastLongitude = 0;
  let encoded = "";

  for (const [latitude, longitude] of points) {
    const nextLatitude = Math.round(latitude * 1e6);
    const nextLongitude = Math.round(longitude * 1e6);
    encoded += encodeValue(nextLatitude - lastLatitude);
    encoded += encodeValue(nextLongitude - lastLongitude);
    lastLatitude = nextLatitude;
    lastLongitude = nextLongitude;
  }

  return encoded;
}

function encodeValue(value) {
  let nextValue = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";

  while (nextValue >= 0x20) {
    encoded += String.fromCharCode((0x20 | (nextValue & 0x1f)) + 63);
    nextValue >>= 5;
  }

  encoded += String.fromCharCode(nextValue + 63);
  return encoded;
}

function restoreEnvValue(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

const origin = { latitude: 32.88114, longitude: -117.23758 };
const destination = { latitude: 32.87962, longitude: -117.23698 };
const shape = encodePolyline6([
  [origin.latitude, origin.longitude],
  [32.88042, -117.23718],
  [destination.latitude, destination.longitude]
]);

test("decodes Valhalla shape with six decimal precision to longitude-latitude order", () => {
  assert.deepEqual(decodeValhallaShape(shape), [
    [-117.23758, 32.88114],
    [-117.23718, 32.88042],
    [-117.23698, 32.87962]
  ]);
});

test("normalizes Valhalla service root to a single route endpoint", () => {
  assert.equal(buildValhallaRouteUrl("https://valhalla.example"), "https://valhalla.example/route");
  assert.equal(
    buildValhallaRouteUrl("https://valhalla.example/route"),
    "https://valhalla.example/route"
  );
  assert.equal(
    buildValhallaRouteUrl("https://valhalla.example/route/"),
    "https://valhalla.example/route"
  );
});

test("normalizes a valid Valhalla route response", () => {
  const route = normalizeValhallaRouteResponse(
    {
      trip: {
        summary: {
          length: 0.22,
          time: 180
        },
        legs: [
          {
            shape,
            summary: {
              length: 0.22,
              time: 180
            },
            maneuvers: [
              {
                instruction: "Walk south on Library Walk.",
                length: 0.1,
                time: 75,
                type: 1,
                street_names: ["Library Walk"],
                begin_shape_index: 0,
                end_shape_index: 1
              }
            ]
          }
        ]
      }
    },
    { origin, destination }
  );

  assert.equal(route.provider, "valhalla");
  assert.equal(route.isEstimated, false);
  assert.equal(route.distanceMeters, 220);
  assert.equal(route.durationSeconds, 180);
  assert.equal(route.geometry.type, "LineString");
  assert.equal(route.geometry.coordinates.length, 3);
  assert.deepEqual(route.steps[0], {
    instruction: "Walk south on Library Walk.",
    distanceMeters: 100,
    durationSeconds: 75,
    maneuverType: "1",
    streetName: "Library Walk",
    beginShapeIndex: 0,
    endShapeIndex: 1
  });
});

test("rejects missing trip", () => {
  assert.throws(
    () => normalizeValhallaRouteResponse({}, { origin, destination }),
    (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_RESPONSE
  );
});

test("rejects missing legs", () => {
  assert.throws(
    () => normalizeValhallaRouteResponse({ trip: { legs: [] } }, { origin, destination }),
    (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.UNROUTABLE
  );
});

test("rejects missing shape", () => {
  assert.throws(
    () => normalizeValhallaRouteResponse({ trip: { legs: [{}] } }, { origin, destination }),
    (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_RESPONSE
  );
});

test("rejects malformed shape", () => {
  assert.throws(
    () =>
      normalizeValhallaRouteResponse(
        { trip: { legs: [{ shape: "_", summary: { length: 0.1, time: 60 } }] } },
        { origin, destination }
      ),
    (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_RESPONSE
  );
});

test("maps provider errors to internal routing errors", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example";
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    await assert.rejects(
      () => requestValhallaWalkingRoute({ origin, destination }),
      (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_FAILURE
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
  }
});

test("maps provider aborts to timeout errors", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example";
    globalThis.fetch = async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    };

    await assert.rejects(
      () => requestValhallaWalkingRoute({ origin, destination }),
      (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_TIMEOUT
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
  }
});

test("rejects invalid server-configured API key header names", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  const originalApiKey = process.env.VALHALLA_API_KEY;
  const originalApiKeyHeader = process.env.VALHALLA_API_KEY_HEADER;

  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example";
    process.env.VALHALLA_API_KEY = "test-key";
    process.env.VALHALLA_API_KEY_HEADER = "Invalid Header";
    globalThis.fetch = async () => {
      throw new Error("fetch should not be called");
    };

    await assert.rejects(
      () => requestValhallaWalkingRoute({ origin, destination }),
      (error) =>
        error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
    restoreEnvValue("VALHALLA_API_KEY", originalApiKey);
    restoreEnvValue("VALHALLA_API_KEY_HEADER", originalApiKeyHeader);
  }
});
