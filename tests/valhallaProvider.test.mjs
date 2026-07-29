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
const secondLegShape = encodePolyline6([
  [destination.latitude, destination.longitude],
  [32.8792, -117.2365],
  [32.8789, -117.2361]
]);
const secondLegDestination = { latitude: 32.8789, longitude: -117.2361 };

test("decodes Valhalla shape with six decimal precision to longitude-latitude order", () => {
  assert.deepEqual(decodeValhallaShape(shape), [
    [-117.23758, 32.88114],
    [-117.23718, 32.88042],
    [-117.23698, 32.87962]
  ]);
});

test("normalizes Valhalla service root to a single route endpoint", () => {
  assert.equal(buildValhallaRouteUrl("https://valhalla.example"), "https://valhalla.example/route");
  assert.equal(buildValhallaRouteUrl("https://valhalla.example/"), "https://valhalla.example/route");
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
    type: "1",
    maneuverType: "1",
    streetNames: ["Library Walk"],
    streetName: "Library Walk",
    beginShapeIndex: 0,
    endShapeIndex: 1
  });
});

test("normalizes multi-leg routes and removes only duplicate leg-boundary coordinates", () => {
  const route = normalizeValhallaRouteResponse(
    {
      trip: {
        summary: {
          length: 0.4,
          time: 300
        },
        legs: [
          {
            shape,
            summary: {
              length: 0.22,
              time: 180
            },
            maneuvers: [{ instruction: "Start walking.", length: 0.22, time: 180, type: 1 }]
          },
          {
            shape: secondLegShape,
            summary: {
              length: 0.18,
              time: 120
            },
            maneuvers: [{ instruction: "Continue walking.", length: 0.18, time: 120, type: 2 }]
          }
        ]
      }
    },
    { origin, destination: secondLegDestination }
  );

  assert.equal(route.geometry.coordinates.length, 5);
  assert.deepEqual(route.geometry.coordinates[2], [destination.longitude, destination.latitude]);
  assert.deepEqual(route.geometry.coordinates[3], [-117.2365, 32.8792]);
  assert.equal(route.distanceMeters, 400);
  assert.equal(route.durationSeconds, 300);
  assert.equal(route.steps.length, 2);
  assert.deepEqual(route.steps.map((step) => step.instruction), [
    "Start walking.",
    "Continue walking."
  ]);
});

test("preserves non-duplicate leg-boundary coordinates", () => {
  const route = normalizeValhallaRouteResponse(
    {
      trip: {
        legs: [
          {
            shape,
            summary: {
              length: 0.22,
              time: 180
            }
          },
          {
            shape: encodePolyline6([
              [32.8795, -117.2368],
              [32.8792, -117.2365],
              [secondLegDestination.latitude, secondLegDestination.longitude]
            ]),
            summary: {
              length: 0.18,
              time: 120
            }
          }
        ]
      }
    },
    { origin, destination: secondLegDestination }
  );

  assert.equal(route.geometry.coordinates.length, 6);
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

test("rejects missing Valhalla base URL", async () => {
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  try {
    delete process.env.VALHALLA_BASE_URL;

    await assert.rejects(
      () => requestValhallaWalkingRoute({ origin, destination }),
      (error) =>
        error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION
    );
  } finally {
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
  }
});

test("sends an unauthenticated pedestrian route request", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  const originalApiKey = process.env.VALHALLA_API_KEY;
  const originalApiKeyHeader = process.env.VALHALLA_API_KEY_HEADER;

  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example/";
    delete process.env.VALHALLA_API_KEY;
    delete process.env.VALHALLA_API_KEY_HEADER;
    let requestUrl;
    let requestOptions;

    globalThis.fetch = async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return {
        ok: true,
        json: async () => ({
          trip: {
            summary: { length: 0.22, time: 180 },
            legs: [{ shape, summary: { length: 0.22, time: 180 } }]
          }
        })
      };
    };

    await requestValhallaWalkingRoute({ origin, destination });
    const body = JSON.parse(requestOptions.body);

    assert.equal(requestUrl, "https://routing.example/route");
    assert.equal(requestOptions.method, "POST");
    assert.deepEqual(requestOptions.headers, { "Content-Type": "application/json" });
    assert.deepEqual(body, {
      locations: [
        { lat: origin.latitude, lon: origin.longitude, type: "break" },
        { lat: destination.latitude, lon: destination.longitude, type: "break" }
      ],
      costing: "pedestrian",
      units: "kilometers",
      language: "en-US",
      directions_options: {
        units: "kilometers"
      }
    });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
    restoreEnvValue("VALHALLA_API_KEY", originalApiKey);
    restoreEnvValue("VALHALLA_API_KEY_HEADER", originalApiKeyHeader);
  }
});

test("sends a header-authenticated provider request without returning the key", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  const originalApiKey = process.env.VALHALLA_API_KEY;
  const originalApiKeyHeader = process.env.VALHALLA_API_KEY_HEADER;

  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example/route";
    process.env.VALHALLA_API_KEY = "test-secret-key";
    process.env.VALHALLA_API_KEY_HEADER = "X-Test-Key";
    let requestOptions;

    globalThis.fetch = async (_url, options) => {
      requestOptions = options;
      return {
        ok: true,
        json: async () => ({
          trip: {
            summary: { length: 0.22, time: 180 },
            legs: [{ shape, summary: { length: 0.22, time: 180 } }]
          }
        })
      };
    };

    const route = await requestValhallaWalkingRoute({ origin, destination });

    assert.equal(requestOptions.headers["X-Test-Key"], "test-secret-key");
    assert.equal(JSON.stringify(route).includes("test-secret-key"), false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
    restoreEnvValue("VALHALLA_API_KEY", originalApiKey);
    restoreEnvValue("VALHALLA_API_KEY_HEADER", originalApiKeyHeader);
  }
});

test("rejects incomplete provider authentication configuration", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  const originalApiKey = process.env.VALHALLA_API_KEY;
  const originalApiKeyHeader = process.env.VALHALLA_API_KEY_HEADER;

  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example";
    process.env.VALHALLA_API_KEY = "test-key";
    delete process.env.VALHALLA_API_KEY_HEADER;
    globalThis.fetch = async () => {
      throw new Error("fetch should not be called");
    };

    await assert.rejects(
      () => requestValhallaWalkingRoute({ origin, destination }),
      (error) =>
        error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION
    );

    delete process.env.VALHALLA_API_KEY;
    process.env.VALHALLA_API_KEY_HEADER = "X-Test-Key";

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

test("returns an explicit accessibility warning without adding unsupported costing options", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  const originalApiKey = process.env.VALHALLA_API_KEY;
  const originalApiKeyHeader = process.env.VALHALLA_API_KEY_HEADER;
  let requestBody;

  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example";
    delete process.env.VALHALLA_API_KEY;
    delete process.env.VALHALLA_API_KEY_HEADER;
    globalThis.fetch = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          trip: {
            summary: { length: 0.22, time: 180 },
            legs: [{ shape, summary: { length: 0.22, time: 180 } }]
          }
        })
      };
    };

    const route = await requestValhallaWalkingRoute({
      origin,
      destination,
      options: { wheelchair: true, avoidStairs: true }
    });

    assert.equal("costing_options" in requestBody, false);
    assert.equal(route.warnings.length, 1);
    assert.match(route.warnings[0], /wheelchair-accessible routing is not guaranteed/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
    restoreEnvValue("VALHALLA_API_KEY", originalApiKey);
    restoreEnvValue("VALHALLA_API_KEY_HEADER", originalApiKeyHeader);
  }
});

test("maps malformed provider JSON to a provider response error", async () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.VALHALLA_BASE_URL;
  try {
    process.env.VALHALLA_BASE_URL = "https://routing.example";
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("bad json");
      }
    });

    await assert.rejects(
      () => requestValhallaWalkingRoute({ origin, destination }),
      (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_RESPONSE
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("VALHALLA_BASE_URL", originalBaseUrl);
  }
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
