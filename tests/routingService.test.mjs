import assert from "node:assert/strict";
import test from "node:test";
import {
  createWalkingRouteRequestKey,
  requestWalkingRoute
} from "../services/routingService.mjs";

const origin = { lat: 32.88114, lng: -117.23758 };
const destination = { latitude: 32.87962, longitude: -117.23698 };
const changedDestination = { latitude: 32.88051, longitude: -117.24102 };
const normalizedRoute = {
  geometry: {
    type: "LineString",
    coordinates: [
      [-117.23758, 32.88114],
      [-117.23698, 32.87962]
    ]
  },
  distanceMeters: 220,
  durationSeconds: 180,
  steps: [],
  provider: "valhalla",
  isEstimated: false,
  warnings: []
};

test("creates stable request keys for duplicate walking routes", () => {
  const request = {
    origin,
    destination,
    options: { wheelchair: false }
  };

  assert.equal(createWalkingRouteRequestKey(request), createWalkingRouteRequestKey(request));
});

test("returns normalized routes from the internal API", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => normalizedRoute
    });

    assert.deepEqual(await requestWalkingRoute({ origin, destination }), normalizedRoute);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("surfaces useful route request failures", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 502,
      json: async () => ({
        error: {
          code: "PROVIDER_CONFIGURATION",
          message: "Walking routing provider is not configured."
        }
      })
    });

    await assert.rejects(
      () => requestWalkingRoute({ origin, destination }),
      (error) =>
        error.code === "PROVIDER_CONFIGURATION" &&
        error.status === 502 &&
        error.message === "Walking routing provider is not configured."
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("deduplicates identical active route requests", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  let resolveFetch;
  const pendingFetch = new Promise((resolve) => {
    resolveFetch = resolve;
  });

  try {
    globalThis.fetch = async () => {
      fetchCount += 1;
      return pendingFetch;
    };

    const firstRequest = requestWalkingRoute({ origin, destination });
    const secondRequest = requestWalkingRoute({ origin, destination });
    assert.equal(fetchCount, 1);

    resolveFetch({
      ok: true,
      json: async () => normalizedRoute
    });

    assert.deepEqual(await Promise.all([firstRequest, secondRequest]), [
      normalizedRoute,
      normalizedRoute
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps changed destinations as separate requests", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  try {
    globalThis.fetch = async () => {
      fetchCount += 1;
      return {
        ok: true,
        json: async () => normalizedRoute
      };
    };

    await Promise.all([
      requestWalkingRoute({ origin, destination }),
      requestWalkingRoute({ origin, destination: changedDestination })
    ]);

    assert.equal(fetchCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("allows aborted requests to reject without replacing newer state", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      if (options.signal?.aborted) {
        const error = new Error("aborted");
        error.name = "AbortError";
        throw error;
      }

      return {
        ok: true,
        json: async () => normalizedRoute
      };
    };

    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      () => requestWalkingRoute({ origin, destination, signal: controller.signal }),
      (error) => error.name === "AbortError"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
