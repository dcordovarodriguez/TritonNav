import assert from "node:assert/strict";
import test from "node:test";
import {
  ROUTE_ERROR_CODES,
  RoutingError,
  createNormalizedWalkingRoute,
  validateLineStringGeometry,
  validateRouteEndpoints,
  validateWalkingRouteRequest
} from "../lib/routing/routeModel.mjs";

const validOrigin = { latitude: 32.88114, longitude: -117.23758 };
const validDestination = { latitude: 32.87962, longitude: -117.23698 };

function assertInvalidRequest(body) {
  assert.throws(
    () => validateWalkingRouteRequest(body),
    (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.INVALID_REQUEST
  );
}

test("validates walking route requests", () => {
  assert.deepEqual(validateWalkingRouteRequest({
    origin: validOrigin,
    destination: validDestination
  }), {
    origin: validOrigin,
    destination: validDestination,
    options: {}
  });
});

test("rejects missing origin", () => {
  assertInvalidRequest({ destination: validDestination });
});

test("rejects missing destination", () => {
  assertInvalidRequest({ origin: validOrigin });
});

test("rejects invalid latitude", () => {
  assertInvalidRequest({
    origin: { latitude: 92, longitude: -117.23758 },
    destination: validDestination
  });
});

test("rejects invalid longitude", () => {
  assertInvalidRequest({
    origin: validOrigin,
    destination: { latitude: 32.87962, longitude: -181 }
  });
});

test("rejects string coordinates", () => {
  assertInvalidRequest({
    origin: { latitude: "32.88114", longitude: -117.23758 },
    destination: validDestination
  });
});

test("rejects identical points", () => {
  assertInvalidRequest({
    origin: validOrigin,
    destination: validOrigin
  });
});

function assertProviderResponseError(callback) {
  assert.throws(
    callback,
    (error) => error instanceof RoutingError && error.code === ROUTE_ERROR_CODES.PROVIDER_RESPONSE
  );
}

test("rejects zero-coordinate route geometry", () => {
  assertProviderResponseError(() =>
    validateLineStringGeometry({
      type: "LineString",
      coordinates: []
    })
  );
});

test("rejects one-coordinate route geometry", () => {
  assertProviderResponseError(() =>
    validateLineStringGeometry({
      type: "LineString",
      coordinates: [[-117.23758, 32.88114]]
    })
  );
});

test("accepts valid two-coordinate longitude-latitude geometry", () => {
  const geometry = {
    type: "LineString",
    coordinates: [
      [-117.23758, 32.88114],
      [-117.23698, 32.87962]
    ]
  };

  assert.equal(validateLineStringGeometry(geometry), geometry);
});

test("rejects NaN and Infinity route coordinates", () => {
  assertProviderResponseError(() =>
    validateLineStringGeometry({
      type: "LineString",
      coordinates: [
        [-117.23758, Number.NaN],
        [-117.23698, 32.87962]
      ]
    })
  );

  assertProviderResponseError(() =>
    validateLineStringGeometry({
      type: "LineString",
      coordinates: [
        [-117.23758, 32.88114],
        [Number.POSITIVE_INFINITY, 32.87962]
      ]
    })
  );
});

test("rejects malformed coordinate arrays", () => {
  assertProviderResponseError(() =>
    validateLineStringGeometry({
      type: "LineString",
      coordinates: [[-117.23758], [-117.23698, 32.87962]]
    })
  );

  assertProviderResponseError(() =>
    validateLineStringGeometry({
      type: "LineString",
      coordinates: [
        [-117.23758, 32.88114, 12],
        [-117.23698, 32.87962]
      ]
    })
  );
});

test("rejects reversed latitude-longitude geometry when endpoints no longer match", () => {
  assertProviderResponseError(() =>
    validateRouteEndpoints(
      {
        type: "LineString",
        coordinates: [
          [32.88114, -117.23758],
          [32.87962, -117.23698]
        ]
      },
      validOrigin,
      validDestination
    )
  );
});

test("createNormalizedWalkingRoute rejects malformed geometry before MapView can consume it", () => {
  assertProviderResponseError(() =>
    createNormalizedWalkingRoute({
      geometry: {
        type: "LineString",
        coordinates: [[-117.23758, 32.88114]]
      },
      distanceMeters: 220,
      durationSeconds: 180
    })
  );
});
