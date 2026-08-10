import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  getUcsdRoutingCoverage,
  isWithinUcsdRoutingBounds
} = require("../lib/campus/campusBounds.js");

test("identifies UCSD campus coordinates as inside routing coverage", () => {
  assert.equal(isWithinUcsdRoutingBounds({ lat: 32.88114, lng: -117.23758 }), true);
  assert.deepEqual(getUcsdRoutingCoverage({ lat: 32.8798, lng: -117.23695 }), {
    status: "inside",
    isInside: true
  });
});

test("identifies off-campus coordinates as outside routing coverage", () => {
  assert.equal(isWithinUcsdRoutingBounds({ lat: 32.7157, lng: -117.1611 }), false);
  assert.deepEqual(getUcsdRoutingCoverage({ lat: 34.0522, lng: -118.2437 }), {
    status: "outside",
    isInside: false
  });
});

test("handles missing or invalid coordinates without throwing", () => {
  assert.equal(isWithinUcsdRoutingBounds(null), false);
  assert.deepEqual(getUcsdRoutingCoverage({ lat: Number.NaN, lng: -117.23 }), {
    status: "unknown",
    isInside: false
  });
});
