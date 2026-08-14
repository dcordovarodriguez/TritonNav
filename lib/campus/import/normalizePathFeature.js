const { normalizeSource } = require("../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../normalize.js");
const { getFeatureProperties, getGeometry, lineStringFromGeometry, pickProperty } = require("./geojson.js");
const { toBooleanOrNull } = require("./normalizeEntranceFeature.js");

function normalizePathFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const geometry = lineStringFromGeometry(getGeometry(feature));
  const name = String(pickProperty(properties, ["name", "pathName", "path_name"], "Campus path")).trim();

  if (geometry.length < 2) return null;

  return {
    id: normalizeCampusValue(pickProperty(properties, ["id", "pathId", "path_id"], name)).replace(/\s+/g, "-"),
    name,
    type: "path",
    geometry,
    surface: String(pickProperty(properties, ["surface"], "")).trim(),
    stairs: toBooleanOrNull(pickProperty(properties, ["stairs", "hasStairs", "has_stairs"], null)),
    accessible: toBooleanOrNull(pickProperty(properties, ["accessible", "ada"], null)),
    slope: pickProperty(properties, ["slope", "grade"], null),
    restrictions: String(pickProperty(properties, ["restrictions", "closure", "closures"], "")).trim(),
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    sourceDataset: options.dataset || properties.sourceDataset || properties.dataset || "",
    verified: Boolean(properties.verified || options.verified),
    verifiedAt: properties.verifiedAt || options.verifiedAt || null,
    confidence: properties.confidence || options.confidence || "unknown"
  };
}

module.exports = {
  normalizePathFeature
};
