const { normalizeSource } = require("../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../normalize.js");
const { coordinateFromGeometry, getFeatureProperties, getGeometry, pickProperty } = require("./geojson.js");
const { toBooleanOrNull } = require("./normalizeEntranceFeature.js");

function normalizeAccessibilityFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const coordinates = coordinateFromGeometry(getGeometry(feature));
  const featureType = String(pickProperty(properties, ["type", "featureType", "feature_type"], "accessibility feature")).trim();
  const name = String(pickProperty(properties, ["name", "label"], featureType)).trim();

  if (!coordinates) return null;

  return {
    id: normalizeCampusValue(pickProperty(properties, ["id", "featureId", "feature_id"], name)).replace(/\s+/g, "-"),
    name,
    type: featureType,
    coordinates,
    buildingId: String(pickProperty(properties, ["buildingId", "building_id", "BLDG_ID"], "")).trim(),
    accessible: toBooleanOrNull(pickProperty(properties, ["accessible", "ada"], true)),
    notes: String(pickProperty(properties, ["notes", "description"], "")).trim(),
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    sourceDataset: options.dataset || properties.sourceDataset || properties.dataset || "",
    verified: Boolean(properties.verified || options.verified),
    verifiedAt: properties.verifiedAt || options.verifiedAt || null,
    confidence: properties.confidence || options.confidence || "unknown"
  };
}

module.exports = {
  normalizeAccessibilityFeature
};
