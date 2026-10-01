import assert from "node:assert/strict";
import test from "node:test";
import {
  ORIGIN_MODES,
  areRouteEndpointsEquivalent,
  resolveActiveRouteOrigin
} from "../lib/originSelection.mjs";

const geisel = { lat: 32.88114, lng: -117.23758 };
const priceCenter = { lat: 32.87973, lng: -117.23618 };
const sanJose = { lat: 37.3382, lng: -121.8863 };

test("selected campus origin remains independent from device location", () => {
  assert.deepEqual(
    resolveActiveRouteOrigin({
      mode: ORIGIN_MODES.SELECTED,
      selectedOrigin: { coordinate: geisel, label: "Geisel Library" },
      deviceLocation: sanJose,
      deviceIsInsideCoverage: false
    }),
    geisel
  );
});

test("current location is routable only inside campus coverage", () => {
  assert.equal(
    resolveActiveRouteOrigin({
      mode: ORIGIN_MODES.CURRENT,
      selectedOrigin: null,
      deviceLocation: sanJose,
      deviceIsInsideCoverage: false
    }),
    null
  );

  assert.deepEqual(
    resolveActiveRouteOrigin({
      mode: ORIGIN_MODES.CURRENT,
      selectedOrigin: null,
      deviceLocation: geisel,
      deviceIsInsideCoverage: true
    }),
    geisel
  );
});

test("missing origin stays unresolved", () => {
  assert.equal(
    resolveActiveRouteOrigin({
      mode: ORIGIN_MODES.CURRENT,
      selectedOrigin: null,
      deviceLocation: null,
      deviceIsInsideCoverage: false
    }),
    null
  );
});

test("equivalent route endpoints are detected without conflating nearby places", () => {
  assert.equal(areRouteEndpointsEquivalent(geisel, { ...geisel }), true);
  assert.equal(areRouteEndpointsEquivalent(geisel, priceCenter), false);
  assert.equal(areRouteEndpointsEquivalent(null, priceCenter), false);
});
